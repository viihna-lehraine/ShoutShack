import argon2 from 'argon2';
import { execSync } from 'child_process';
import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes
} from 'crypto';
import path from 'path';
import { hashConfig } from '../utils/constants';
import { configService } from '../services/configService';
import {
	ConfigSecretsInterface,
	ErrorHandlerInterface
} from '../index/interfaces';
import { ErrorHandler, errorHandler } from '../services/errorHandler';
import { HandleErrorStaticParameters } from '../index/parameters';
import { AppLogger, ErrorLogger } from '../services/logger';

const algorithm = 'aes-256-ctr';
const ivLength = 16;
const PLACEHOLDER = '[REDACTED]';

export class SecretsStore {
	private static instance: SecretsStore;
	private secrets: Map<
		string,
		{
			encryptedValue: string;
			hash: string;
			isDecrypted: boolean;
			lastAccessed: number;
		}
	> = new Map();
	private encryptedGpgPassphrase: string | null = null;
	private encryptionKey: string | null = null;
	private MAX_ATTEMPTS: number =
		configService.getEnvVariables().secretsRateLimitMaxAttempts;
	private RATE_LIMIT_WINDOW: number =
		configService.getEnvVariables().secretsRateLimitWindow;
	private reEncryptionCooldown: number =
		configService.getEnvVariables().secretsReEncryptionCooldown;
	private secretAccessAttempts: Map<
		string,
		{ attempts: number; lastAttempt: number }
	> = new Map();
	private logger: import('../index/interfaces').AppLoggerInterface =
		configService.getAppLogger();
	private errorLogger = configService.getErrorLogger();
	private errorHandler: ErrorHandlerInterface = ErrorHandler.getInstance(
		new AppLogger(),
		new ErrorLogger()
	);

	private constructor() {}

	public static getInstance(): SecretsStore {
		if (!SecretsStore.instance) {
			SecretsStore.instance = new SecretsStore();
		}

		return SecretsStore.instance;
	}

	public initializeEncryptionKey(encryptionKey: string): void {
		this.encryptionKey = encryptionKey;
	}

	public async loadSecrets(
		dependencies: ConfigSecretsInterface
	): Promise<void> {
		const { execSync, getDirectoryPath, gpgPassphrase } = dependencies;
		const secretsPath = path.join(
			getDirectoryPath(),
			configService.getEnvVariables().secretsFilePath1
		);

		try {
			const decryptedSecrets = execSync(
				`sops -d --output-type json --passphrase ${gpgPassphrase} ${secretsPath}`
			).toString();
			const secrets = JSON.parse(decryptedSecrets);

			for (const key in secrets) {
				const { encryptedValue } = await this.encryptSecret(
					secrets[key]
				);
				this.secrets.set(key, {
					encryptedValue,
					hash: await argon2.hash(secrets[key], hashConfig),
					isDecrypted: false,
					lastAccessed: Date.now()
				});
			}

			this.logger.debug('Secrets loaded successfully');
			this.reEncryptSecretsFile(secretsPath, gpgPassphrase);
			this.encryptGPGPassphraseInMemory(gpgPassphrase);
		} catch (error) {
			const secretsLoadError =
				new errorHandler.ErrorClasses.ConfigurationError(
					`Failed to load secrets: ${error instanceof Error ? error.message : String(error)}`,
					{ originalError: error }
				);
			const details: Record<string, unknown> = {
				requestId: 'N/A',
				adminId: 'N/A',
				action: 'secrets_load',
				timestamp: new Date().toISOString(),
				additionalInfo: {
					ip: 'N/A',
					userAgent: 'N/A'
				}
			};
			this.errorLogger.logError(
				`{ ${secretsLoadError.message}\n${details} }`
			);
			this.errorHandler.handleError({
				...HandleErrorStaticParameters,
				error: secretsLoadError
			});
			throw secretsLoadError;
		}
	}

	public async storeSecret(key: string, secret: string): Promise<void> {
		const { encryptedValue, hash } = await this.encryptSecret(secret);
		this.secrets.set(key, {
			encryptedValue,
			hash,
			isDecrypted: false,
			lastAccessed: Date.now()
		});
	}

	public retrieveSecret(key: string): string | null {
		if (this.isRateLimited(key)) {
			this.logger.warn(`Rate limit exceeded for secret: ${key}`);
			return null;
		}

		const secretData = this.secrets.get(key);

		if (!secretData) return null;

		const decryptedSecret = this.decryptSecret(secretData.encryptedValue);

		secretData.isDecrypted = true;
		secretData.lastAccessed = Date.now();

		return decryptedSecret;
	}

	public retrieveSecrets(
		secretKeys: string | string[]
	): Record<string, string | null> | string | null {
		if (typeof secretKeys === 'string') {
			secretKeys = [secretKeys];
		}

		const secretsResult: Record<string, string | null> = {};

		for (const key of secretKeys) {
			const secretData = this.secrets.get(key);

			if (!secretData) {
				this.logger.error(`Secret ${key} not found`);
				secretsResult[key] = null;

				continue;
			}

			if (secretData.isDecrypted) {
				secretData.lastAccessed = Date.now();
				secretsResult[key] = secretData.encryptedValue;
			} else {
				const decryptedSecret = this.decryptSecret(
					secretData.encryptedValue
				);

				this.secrets.set(key, {
					...secretData,
					isDecrypted: true,
					lastAccessed: Date.now()
				});
				secretsResult[key] = decryptedSecret;
			}
		}

		return Array.isArray(secretKeys) && secretKeys.length === 1
			? secretsResult[secretKeys[0]]
			: secretsResult;
	}

	public async redactSecrets(
		logData: string | Record<string, unknown> | unknown[]
	): Promise<string | Record<string, unknown> | unknown[]> {
		const secretHashes = this.getSecretsHashes();

		if (typeof logData === 'string') {
			return this.redactInString(logData, secretHashes);
		}

		return this.traverseAndRedact(logData, secretHashes);
	}

	public decrptTLSKeys(
		logger: import('../index/interfaces').AppLoggerInterface
	): object {
		try {
			const decryptedPassphrase = this.decryptGPGPassphraseInMemory();
			const decryptedKey = execSync(
				`sops -d --passphrase ${decryptedPassphrase} ${configService.getEnvVariables().tlsKeyPath1}`
			).toString();
			const decryptedCert = execSync(
				`sops -d --passphrase ${decryptedPassphrase} ${configService.getEnvVariables().tlsCertPath1}`
			).toString();

			this.encryptGPGPassphraseInMemory(decryptedPassphrase);

			logger.debug('TLS keys decrypted successfully');
			return { decryptedKey, decryptedCert };
		} catch (tlsError) {
			const tlsKeyDecryptionError =
				new errorHandler.ErrorClasses.ConfigurationErrorFatal(
					`Fatal error: Failed to decrypt TLS keys\n${tlsError instanceof Error ? tlsError.message : String(tlsError)}`,
					{ originalError: tlsError }
				);
			const details: Record<string, unknown> = {
				requestId: 'N/A',
				action: 'tls_key_decryption',
				timestamp: new Date().toISOString()
			};
			this.errorLogger.logError(
				`${tlsKeyDecryptionError.message}\n${details}`
			);
			errorHandler.handleError({
				...HandleErrorStaticParameters,
				error: tlsKeyDecryptionError
			});
			throw tlsKeyDecryptionError;
		}
	}

	public async reEncryptSecret(secretKey: string): Promise<void> {
		const secretData = this.secrets.get(secretKey);

		if (!secretData || !secretData.isDecrypted) {
			return;
		}

		const currentTime = Date.now();
		const isTimeElapsed = currentTime - secretData.lastAccessed;

		if (isTimeElapsed < this.reEncryptionCooldown) {
			const { encryptedValue } = await this.encryptSecret(
				secretData.encryptedValue
			);

			this.secrets.set(secretKey, {
				...secretData,
				encryptedValue,
				isDecrypted: false,
				lastAccessed: Date.now()
			});
		}
	}

	public async reEncryptSecrets(keys: string[]): Promise<void> {
		const promises = keys.map(async key => {
			await this.reEncryptSecret(key);
		});

		await Promise.all(promises);
	}

	public async batchReEncryptSecrets(): Promise<void> {
		const promises: Promise<void>[] = [];
		this.secrets.forEach((secretData, key) => {
			if (secretData.isDecrypted) {
				promises.push(this.reEncryptSecret(key));
			}
		});

		await Promise.all(promises);
		this.logger.debug('Batch re-encryption completed');
	}

	public clearExpiredSecretsFromMemory(): void {
		const currentTime = Date.now();
		this.secrets.forEach((secretData, key) => {
			const isTimeElapsed = currentTime - secretData.lastAccessed;

			if (
				isTimeElapsed >= this.reEncryptionCooldown &&
				secretData.isDecrypted
			) {
				this.secrets.set(key, {
					...secretData,
					isDecrypted: false
				});
				this.logger.debug(`Secret ${key} cleared from memory`);
			}
		});
	}

	public clearSecretsFromMemory(secretKeys: string | string[]): void {
		const keysToClear = Array.isArray(secretKeys)
			? secretKeys
			: [secretKeys];

		keysToClear.forEach(key => {
			const secretData = this.secrets.get(key);

			if (!secretData) {
				this.logger.error(`Secret ${key} not found`);
				return;
			}

			if (!secretData.isDecrypted) {
				this.logger.debug(
					`Secret ${key} is already cleared from memory`
				);
			}

			this.secrets.set(key, {
				...secretData,
				isDecrypted: false
			});

			this.logger.debug(`Secret ${key} has been cleared from memory`);
		});
	}

	public releaseSecret(secretKey: string): void {
		this.reEncryptSecret(secretKey);
	}

	public refreshSecrets(dependencies: ConfigSecretsInterface): void {
		this.loadSecrets(dependencies);
	}

	private async encryptSecret(
		secret: string
	): Promise<{ encryptedValue: string; hash: string }> {
		const iv = randomBytes(ivLength);
		const cipher = createCipheriv(
			algorithm,
			this.getEncryptionKeyHash(),
			iv
		);
		const encrypted = Buffer.concat([
			cipher.update(secret, 'utf-8'),
			cipher.final()
		]);

		const encryptedValue = `${iv.toString('hex')}:${encrypted.toString('hex')}`;
		const hash = await argon2.hash(secret, hashConfig);

		return { encryptedValue, hash };
	}

	private getSecretsHashes(): string[] {
		return [...this.secrets.values()].map(secretData => secretData.hash);
	}

	private async redactInString(
		logData: string,
		secretHashes: string[]
	): Promise<string> {
		for (const hash of secretHashes) {
			const isMatch = await argon2.verify(hash, logData);

			if (isMatch) {
				return logData.replace(new RegExp(logData, 'g'), PLACEHOLDER);
			}
		}

		return logData;
	}

	private async traverseAndRedact(
		data: Record<string, unknown> | unknown[],
		secretsHashes: string[]
	): Promise<Record<string, unknown> | unknown[]> {
		if (Array.isArray(data)) {
			return Promise.all(
				data.map(async item =>
					typeof item === 'object'
						? this.traverseAndRedact(
								item as Record<string, unknown>,
								secretsHashes
							)
						: item
				)
			);
		} else if (typeof data === 'object' && data !== null) {
			const result: Record<string, unknown> = {};

			for (const [key, value] of Object.entries(data)) {
				if (typeof value === 'object' && value !== null) {
					result[key] = await this.traverseAndRedact(
						value as Record<string, unknown>,
						secretsHashes
					);
				} else if (typeof value === 'string') {
					for (const hash of secretsHashes) {
						const isMatch = await argon2.verify(hash, value);

						if (isMatch) {
							result[key] = '[REDACTED]';
							break;
						}
					}
					result[key] = value;
				} else {
					result[key] = value;
				}
			}
			return result;
		}
		return data;
	}

	private isRateLimited(key: string): boolean {
		const currentTime = Date.now();
		let rateData = this.secretAccessAttempts.get(key);

		if (!rateData) {
			rateData = { attempts: 0, lastAttempt: currentTime };
			this.secretAccessAttempts.set(key, rateData);
		}

		const timeElapsed = currentTime - rateData.lastAttempt;

		if (timeElapsed > this.RATE_LIMIT_WINDOW) {
			rateData.attempts = 1;
			rateData.lastAttempt = currentTime;
			this.secretAccessAttempts.set(key, rateData);

			return false;
		}

		if (rateData.attempts >= this.MAX_ATTEMPTS) {
			this.logger.warn(`Rate limit exceeded for key: ${key}`);
			return true;
		}

		rateData.attempts += 1;
		rateData.lastAttempt = currentTime;
		this.secretAccessAttempts.set(key, rateData);

		return false;
	}

	private decryptSecret(encryptedSecret: string): string {
		const [ivHex, encryptedHex] = encryptedSecret.split(':');
		const iv = Buffer.from(ivHex, 'hex');
		const encryptedText = Buffer.from(encryptedHex, 'hex');
		const decipher = createDecipheriv(
			algorithm,
			this.getEncryptionKeyHash(),
			iv
		);
		const decrypted = Buffer.concat([
			decipher.update(encryptedText),
			decipher.final()
		]);

		return decrypted.toString();
	}

	private encryptGPGPassphraseInMemory(secret: string): string {
		const iv = randomBytes(ivLength);
		const cipher = createCipheriv(
			algorithm,
			this.getEncryptionKeyHash(),
			iv
		);
		const encrypted = Buffer.concat([
			cipher.update(secret, 'utf-8'),
			cipher.final()
		]);

		const encryptedGpgPassphrase = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

		return encryptedGpgPassphrase;
	}

	private decryptGPGPassphraseInMemory(): string {
		if (!this.encryptedGpgPassphrase) {
			throw new Error(
				`No GPG passphrase found in memory\n${Error instanceof Error ? Error.message : String(Error)}`
			);
		}

		const decryptedGPGPassphrase = this.decryptSecret(
			this.encryptedGpgPassphrase
		);

		return decryptedGPGPassphrase;
	}

	private getEncryptionKeyHash(): Buffer {
		return createHash('sha256').update(this.encryptionKey!).digest();
	}

	private reEncryptSecretsFile(
		secretsPath: string,
		decryptedGPGPassphrase: string
	): void {
		try {
			this.decryptGPGPassphraseInMemory();
			execSync(
				`sops -e passphrase ${decryptedGPGPassphrase} ${secretsPath}`
			);
			this.logger.debug(`Secrets file re-enrypted successfully`);
		} catch (error) {
			console.error(
				`Failed to re-encrypt secrets file\n${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
	}
}

export const envSecretsStore = SecretsStore.getInstance();
