import argon2 from 'argon2';
import { execSync } from 'child_process';
import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes
} from 'crypto';
import path from 'path';
import { hashConfig } from '../config/security';
import { SecretsMap } from '../index/interfaces/env';
import { VaultServiceInterface } from '../index/interfaces/services';
import { ConfigSecretsInterface } from '../index/interfaces/serviceComponents';
import { HandleErrorStaticParameters } from '../index/parameters';
import { withRetry } from '../utils/helpers';
import {
	AppLoggerServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';

const algorithm = 'aes-256-ctr';
const ivLength = 16;
const PLACEHOLDER = '[REDACTED]';

export class VaultService implements VaultServiceInterface {
	private static instance: VaultService | null = null;
	private envConfig: EnvConfigServiceInterface;
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

	private constructor(
		encryptionKey: string,
		gpgPassphrase: string,
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		envConfig: EnvConfigServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.envConfig = envConfig;
		this.maxAttempts = Number(
			this.envConfig.getEnvVariable('secretsRateLimitMaxAttempts')
		);
		this.rateLimitWindow = Number(
			this.envConfig.getEnvVariable('secretsRateLimitWindow')
		);
		this.initializeEncryptionKey(encryptionKey);
		this.loadAndSecureSecrets(gpgPassphrase);
		this.encryptGPGPassphraseInMemory(gpgPassphrase);
	}

	public static async getInstance(): Promise<VaultService> {
		if (!VaultService.instance) {
			throw new Error(
				'SecretsStore not initialized. Ensure it is initialized after login.'
			);
		}

		return VaultService.instance;
	}

	public static async initialize(
		encryptionKey: string,
		gpgPassphrase: string
	): Promise<VaultService> {
		try {
			if (!VaultService.instance) {
				const logger = await ServiceFactory.getLoggerService();
				const errorLogger =
					await ServiceFactory.getErrorLoggerService();
				const errorHandler =
					await ServiceFactory.getErrorHandlerService();
				const envConfig = await ServiceFactory.getEnvConfigService();

				VaultService.instance = new VaultService(
					encryptionKey,
					gpgPassphrase,
					logger,
					errorLogger,
					errorHandler,
					envConfig
				);
			}
			return VaultService.instance;
		} catch (error) {
			const initializationError = new Error(
				`Failed to initialize VaultService: ${error instanceof Error ? error.message : String(error)}`
			);
			// Log the error here
			throw initializationError;
		}
	}

	private async loadAndSecureSecrets(gpgPassphrase: string): Promise<void> {
		try {
			await withRetry(
				async () => {
					const secretsFilePath =
						this.envConfig.getEnvVariable('secretsFilePath1');
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

					this.logger.info(
						'Secrets loaded, encrypted, and secured successfully.'
					);
				},
				5,
				1000,
				true
			);
		} catch (error) {
			this.handleLoadSecretsError(error);
		}
	}

	private initializeEncryptionKey(encryptionKey: string): void {
		if (!encryptionKey) {
			throw new Error('Encryption key not provided or invalid');
		}
		this.encryptionKey = encryptionKey;
		this.logger.info('Encryption key initialized.');
	}

	private async loadSecrets(
		dependencies: ConfigSecretsInterface
	): Promise<void> {
		const { execSync, getDirectoryPath, gpgPassphrase } = dependencies;
		const secretsPath = path.join(
			getDirectoryPath(),
			this.envConfig.getEnvVariable('secretsFilePath1')
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
		this.logger.info(`Secret ${key} stored successfully.`);
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
				if (!secretData) {
					this.logger.error(`Secret ${key} not found.`);
					return null;
				}

				const decryptedSecret = this.decryptSecret(
					secretData.encryptedValue
				);

				try {
					usageCallback(decryptedSecret);
				} finally {
					this.clearMemory(decryptedSecret);
					this.logger.debug(
						`Decrypted secret ${key} wiped from memory.`
					);
				}

				return decryptedSecret;
			},
			5,
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
					if (this.isRateLimited(key)) {
						this.logger.warn(
							`Rate limit exceeded for secret: ${key}`
						);
						continue;
					}

					const secretData = this.secrets.get(key);

					if (!secretData) {
						this.logger.error(`Secret ${key} not found.`);
					} else {
						const decryptedSecret = this.decryptSecret(
							secretData.encryptedValue
						);

						if (key === 'YUBICO_CLIENT_ID') {
							result[key] = Number(
								decryptedSecret
							) as SecretsMap[typeof key];
						} else {
							result[key] =
								decryptedSecret as SecretsMap[typeof key];
						}

						try {
							this.clearMemory(decryptedSecret);
						} finally {
							this.logger.debug(
								`Decrypted secret ${key} wiped from memory.`
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
			const buffer = Buffer.from(secret, 'utf-8');
			buffer.fill(0);
		} else if (Buffer.isBuffer(secret)) {
			secret.fill(0);
		}

		secret = null as unknown as string | Buffer;
		this.logger.debug('Sensitive data cleared from memory.');
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

			withRetry(
				async () => {
					this.loadSecrets({
						...dependencies,
						gpgPassphrase
					})
						.then(() => {
							this.logger.info('Secrets refreshed successfully');
						})
						.catch(error => {
							throw new Error(
								`Failed to refresh secrets: ${error.message}`
							);
						});

					this.clearMemory(gpgPassphrase);
				},
				5,
				1000,
				true
			);
		} catch (error) {
			this.handleRefreshSecretsError(error);
		}
	}

	private getEncryptionKeyHash(): Buffer {
		if (!this.encryptionKey) {
			throw new Error('Encryption key is not initialized');
		}

		return createHash('sha256').update(this.encryptionKey!).digest();
	}

	private encryptGPGPassphraseInMemory(gpgPassphrase: string): string {
		const iv = randomBytes(ivLength);
		const cipher = createCipheriv(
			algorithm,
			this.getEncryptionKeyHash(),
			iv
		);
		const encrypted = Buffer.concat([
			cipher.update(gpgPassphrase, 'utf-8'),
			cipher.final()
		]);

		this.encryptedGpgPassphrase = `${iv.toString('hex')}:${encrypted.toString('hex')}`;
		return this.encryptedGpgPassphrase;
	}

	private decryptGPGPassphraseInMemory(): string {
		if (!this.encryptedGpgPassphrase) {
			throw new Error('No GPG passphrase found in memory');
		}

		const decryptedPassphrase = this.decryptSecret(
			this.encryptedGpgPassphrase
		);

		try {
			return decryptedPassphrase;
		} finally {
			this.clearMemory(decryptedPassphrase);
		}
	}

	public clearExpiredSecretsFromMemory(): void {
		const currentTime = Date.now();
		this.secrets.forEach((secretData, key) => {
			const isTimeElapsed = currentTime - secretData.lastAccessed;

			if (
				isTimeElapsed >=
					this.envConfig.getEnvVariable('secretsExpiryTimeout') &&
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
				this.logger.error(`Secret ${key} not found.`);
				return;
			}

			if (!secretData.isDecrypted) {
				this.logger.debug(
					`Secret ${key} is already cleared from memory.`
				);
			}

			this.secrets.set(key, {
				...secretData,
				isDecrypted: false
			});

			this.logger.debug(`Secret ${key} has been cleared from memory.`);
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
						`Secret ${key} cleared from memory successfully.`
					);
				} else {
					this.logger.debug(`Secret ${key} is already encrypted.`);
				}
			}

			this.logger.info(
				'Batch clearing of decrypted secrets completed successfully.'
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

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down VaultService...');

			await this.batchClearSecrets();

			if (this.encryptedGpgPassphrase) {
				this.clearMemory(this.encryptedGpgPassphrase);
				this.encryptedGpgPassphrase = null;
				this.logger.info('GPG passphrase cleared from memory.');
			}

			if (this.encryptionKey) {
				this.clearMemory(this.encryptionKey);
				this.encryptionKey = null;
				this.logger.info('Encryption key cleared from memory.');
			}

			VaultService.instance = null;
			this.logger.info('VaultService instance nullified.');
		} catch (error) {
			this.errorLogger.logError(
				`Error during VaultService shutdown: ${error instanceof Error ? error.message : String(error)}`
			);
			const shutdownError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`VaultService shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
					{ originalError: error }
				);
			this.errorHandler.handleError({ error: shutdownError });
			throw shutdownError;
		}
	}

	private handleLoadSecretsError(error: unknown): void {
		const secretsLoadError =
			new this.errorHandler.ErrorClasses.ConfigurationError(
				`Failed to load secrets: ${error instanceof Error ? error.message : String(error)}`,
				{ originalError: error }
			);
		this.errorLogger.logError(
			`{ ${secretsLoadError.message}\n${secretsLoadError.message} }`
		);
		this.errorHandler.handleError({
			...HandleErrorStaticParameters,
			error: secretsLoadError
		});
		throw secretsLoadError;
	}

	private handleRefreshSecretsError(error: unknown): void {
		const secretsRefreshError =
			new this.errorHandler.ErrorClasses.ConfigurationError(
				`Failed to refresh secrets: ${error instanceof Error ? error.message : String(error)}`,
				{ originalError: error }
			);
		this.errorLogger.logError(secretsRefreshError.message);
		this.errorHandler.handleError({
			error: secretsRefreshError
		});
		throw secretsRefreshError;
	}
}
