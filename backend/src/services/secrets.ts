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
import {
	AppLoggerServiceInterface,
	ConfigSecretsInterface,
	EnvironmentServiceInterface,
	ErrorLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	SecretsMap,
	SecretsStoreInterface
} from '../index/interfaces';
import {
	AppLoggerServiceParameters,
	HandleErrorStaticParameters
} from '../index/parameters';
import { EnvironmentService } from './environment';
import { ErrorHandlerService } from './errorHandler';
import { AppLoggerService, ErrorLoggerService } from './logger';
import { withRetry } from '../utils/helpers';

const algorithm = 'aes-256-ctr';
const ivLength = 16;
const PLACEHOLDER = '[REDACTED]';

export class SecretsStore implements SecretsStoreInterface {
	private static instance: SecretsStore;
	private environmentService: EnvironmentServiceInterface;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
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
	private maxAttempts: number;
	private rateLimitWindow: number;
	private secretAccessAttempts: Map<
		string,
		{ attempts: number; lastAttempt: number }
	> = new Map();

	private constructor(encryptionKey: string, gpgPassphase: string) {
		this.environmentService = EnvironmentService.getInstance();
		this.logger = AppLoggerService.getInstance(
			AppLoggerServiceParameters
		) as AppLoggerServiceInterface;
		this.errorLogger = ErrorLoggerService.getInstance(
			AppLoggerServiceParameters
		) as ErrorLoggerServiceInterface;
		this.errorHandler = ErrorHandlerService.getInstance(
			this.logger,
			this.errorLogger
		) as ErrorHandlerServiceInterface;
		this.maxAttempts = Number(
			this.environmentService.getEnvVariable(
				'secretsRateLimitMaxAttempts'
			)
		);
		this.rateLimitWindow = Number(
			this.environmentService.getEnvVariable('secretsRateLimitWindow')
		);
		this.initializeEncryptionKey(encryptionKey);
		this.loadAndSecureSecrets(gpgPassphase);
	}

	public static getInstance(): SecretsStore {
		if (!SecretsStore.instance) {
			throw new Error(
				'SecretsStore not initialized. Ensure it is initialized after login.'
			);
		}
		return SecretsStore.instance;
	}

	private async loadAndSecureSecrets(gpgPassphrase: string): Promise<void> {
		try {
			await withRetry(
				async () => {
					const secretsFilePath =
						this.environmentService.getEnvVariable(
							'secretsFilePath1'
						);

					const decryptedSecrets = execSync(
						`sops -d --output-type json --passphrase ${gpgPassphrase} ${secretsFilePath}`
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

						this.clearMemory(secrets[key]);
					}

					this.encryptGPGPassphraseInMemory(gpgPassphrase);
					this.clearMemory(gpgPassphrase);

					this.logger.info(
						'Secrets loaded, encrypted, and secured successfully.'
					);
				},
				5,
				1000
			);
		} catch (error) {
			this.handleLoadSecretsError(error);
		}
	}

	public static initialize(
		encryptionKey: string,
		gpgPassphrase: string
	): SecretsStore {
		if (!SecretsStore.instance) {
			SecretsStore.instance = new SecretsStore(
				encryptionKey,
				gpgPassphrase
			);
		}
		return SecretsStore.instance;
	}

	private initializeEncryptionKey(encryptionKey: string): void {
		if (!encryptionKey) {
			throw new Error('Encryption key not provided or invalid');
		}
		this.encryptionKey = encryptionKey;
		this.logger.info('Encryption key initialized.');
	}

	public async loadSecrets(
		dependencies: ConfigSecretsInterface
	): Promise<void> {
		const { execSync, getDirectoryPath, gpgPassphrase } = dependencies;
		const secretsPath = path.join(
			getDirectoryPath(),
			this.environmentService.getEnvVariable('secretsFilePath1')
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

				this.clearMemory(secrets[key]);
			}

			this.logger.debug(
				'Secrets loaded and cleared from memory successfully'
			);

			this.encryptGPGPassphraseInMemory(gpgPassphrase);
			this.clearMemory(gpgPassphrase);
		} catch (error) {
			this.handleLoadSecretsError(error);
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

	public async retrieveSecret(
		key: keyof SecretsMap,
		usageCallback: (secret: string) => void
	): Promise<string | null> {
		return withRetry(
			async () => {
				if (this.isRateLimited(key)) {
					this.logger.warn(`Rate limit exceeded for secret: ${key}`);
					return null;
				}

				const secretData = this.secrets.get(key);
				if (!secretData) return null;

				const decryptedSecret = this.decryptSecret(
					secretData.encryptedValue
				);

				try {
					usageCallback(decryptedSecret);
				} finally {
					this.clearMemory(decryptedSecret);
					this.logger.debug(
						`Decrypted secret ${key} wiped from memory`
					);
				}

				return decryptedSecret;
			},
			3,
			1000
		);
	}

	public async retrieveSecrets(
		secretKeys: (keyof SecretsMap)[],
		usageCallback: (secrets: Partial<SecretsMap>) => void
	): Promise<Partial<SecretsMap> | null> {
		const result: Partial<SecretsMap> = {};

		await withRetry(
			async () => {
				for (const key of secretKeys) {
					const secretData = this.secrets.get(key);

					if (!secretData) {
						this.logger.error(`Secret ${key} not found`);
					} else {
						const decryptedSecret = this.decryptSecret(
							secretData.encryptedValue
						);

						try {
							result[key] = decryptedSecret;
						} finally {
							this.clearMemory(decryptedSecret);
							this.logger.debug(
								`Decrypted secret ${key} wiped from memory`
							);
						}
					}
				}

				usageCallback(result);
			},
			3,
			1000
		);

		return Object.keys(result).length > 0 ? result : null;
	}

	private clearMemory(secret: string | Buffer): void {
		if (typeof secret === 'string') {
			secret = '\0'.repeat(secret.length);
		} else if (Buffer.isBuffer(secret)) {
			secret.fill(0);
		}
		secret = null as unknown as string | Buffer;
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
							result[key] = PLACEHOLDER;
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

	private getSecretsHashes(): string[] {
		return [...this.secrets.values()].map(secretData => secretData.hash);
	}

	private isRateLimited(key: string): boolean {
		const currentTime = Date.now();
		let rateData = this.secretAccessAttempts.get(key);

		if (!rateData) {
			rateData = { attempts: 0, lastAttempt: currentTime };
			this.secretAccessAttempts.set(key, rateData);
		}

		const timeElapsed = currentTime - rateData.lastAttempt;

		if (timeElapsed > this.rateLimitWindow) {
			rateData.attempts = 1;
			rateData.lastAttempt = currentTime;
			this.secretAccessAttempts.set(key, rateData);

			return false;
		}

		if (rateData.attempts >= this.maxAttempts) {
			this.logger.warn(`Rate limit exceeded for key: ${key}`);
			return true;
		}

		rateData.attempts += 1;
		rateData.lastAttempt = currentTime;
		this.secretAccessAttempts.set(key, rateData);

		return false;
	}

	public refreshSecrets(dependencies: ConfigSecretsInterface): void {
		try {
			const gpgPassphrase = this.decryptGPGPassphraseInMemory();

			this.loadSecrets({
				...dependencies,
				gpgPassphrase
			})
				.then(() => {
					this.logger.info('Secrets refreshed successfully');
				})
				.catch(error => {
					this.logger.error('Failed to refresh secrets', { error });
					throw error;
				});

			this.clearMemory(gpgPassphrase);
		} catch (error) {
			this.logger.error('Failed to refresh secrets', { error });
			throw error;
		}
	}

	private getEncryptionKeyHash(): Buffer {
		if (!this.encryptionKey) {
			throw new Error('Encryption key is not initialized');
		}
		return createHash('sha256').update(this.encryptionKey!).digest();
	}

	private reEncryptSecretsFile(
		secretsPath: string,
		decryptedGPGPassphrase: string
	): void {
		try {
			execSync(
				`sops -e --passphrase ${decryptedGPGPassphrase} ${secretsPath}`
			);
			this.logger.debug(`Secrets file re-encrypted successfully`);
		} catch (error) {
			this.logger.error(
				`Failed to re-encrypt secrets file\n${error instanceof Error ? error.message : String(error)}`
			);
			throw error;
		}
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

		this.encryptedGpgPassphrase = `${iv.toString('hex')}:${encrypted.toString('hex')}`;
		return this.encryptedGpgPassphrase;
	}

	private decryptGPGPassphraseInMemory(): string {
		if (!this.encryptedGpgPassphrase) {
			throw new Error('No GPG passphrase found in memory');
		}

		return this.decryptSecret(this.encryptedGpgPassphrase);
	}

	public clearExpiredSecretsFromMemory(): void {
		const currentTime = Date.now();
		this.secrets.forEach((secretData, key) => {
			const isTimeElapsed = currentTime - secretData.lastAccessed;

			if (
				isTimeElapsed >=
					this.environmentService.getEnvVariable(
						'secretsExpiryTimeout'
					) &&
				secretData.isDecrypted
			) {
				this.clearMemory(secretData.encryptedValue);
				this.secrets.set(key, {
					...secretData,
					isDecrypted: false
				});
				this.logger.debug(`Expired secret ${key} cleared from memory`);
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

	public async batchClearSecrets(): Promise<void> {
		try {
			this.logger.info('Starting batch clearing of decrypted secrets...');
			const currentTime = Date.now();

			for (const [key, secretData] of this.secrets.entries()) {
				if (secretData.isDecrypted) {
					this.clearMemory(secretData.encryptedValue);
					this.secrets.set(key, {
						...secretData,
						isDecrypted: false,
						lastAccessed: currentTime
					});

					this.logger.info(
						`Secret ${key} cleared from memory successfully`
					);
				} else {
					this.logger.debug(`Secret ${key} is already encrypted`);
				}
			}

			this.logger.info(
				'Batch clearing of decrypted secrets completed successfully'
			);
		} catch (error) {
			const clearError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to batch clear decrypted secrets: ${error instanceof Error ? error.message : String(error)}`,
					{ originalError: error }
				);
			this.logger.error(clearError.message);
			this.errorHandler.handleError({ error: clearError });
			throw clearError;
		}
	}

	private handleLoadSecretsError(error: unknown): void {
		const secretsLoadError =
			new this.errorHandler.ErrorClasses.ConfigurationError(
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
