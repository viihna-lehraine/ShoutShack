import { execSync } from 'child_process';
import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes
} from 'crypto';
import path from 'path';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { configService } from '../config/configService';
import { appLogger } from '../utils/appLogger';

export interface SecretsDependencies {
	execSync: typeof execSync;
	getDirectoryPath: () => string;
	appLogger: appLogger;
}

export interface SecretsMap {
	[key: string]: string;
}

const algorithm = 'aes-256-ctr';
const ivLength = 16;

export class SecretsStore {
	private static instance: SecretsStore;
	private secrets: Map<
		string,
		{ value: string; isDecrypted: boolean; lastAccessed: number }
	> = new Map();
	private encryptionKey: string | null = null;
	private reEncryptionCooldown: number =
		parseInt(process.env.RE_ENCRYPTION_COOLDOWN!, 10) || 5000; // in ms

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

	public loadSecrets(dependencies: SecretsDependencies): void {
		const { execSync, getDirectoryPath, appLogger } = dependencies;
		try {
			const secretsPath = path.join(
				getDirectoryPath(),
				configService.getEnvVariables().secretsFilePath
			);
			const decryptedSecrets = execSync(
				`sops -d --output-type json --passphrase ${this.encryptionKey} ${secretsPath}`
			).toString();
			const secrets = JSON.parse(decryptedSecrets);

			for (const key in secrets) {
				const encryptedSecret = this.encryptSecret(secrets[key]);

				this.secrets.set(key, {
					value: encryptedSecret,
					isDecrypted: false,
					lastAccessed: Date.now()
				});
			}
			appLogger.info('Secrets loaded successfully');
		} catch (error) {
			const secretsLoadError = new errorClasses.ConfigurationError(
				`Fatal error in APP_INIT process: Failed to load secrets\n${error instanceof Error ? error.message : String(error)}`,
				{
					originalError: error,
					statusCode: 500,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(secretsLoadError);
			processError(secretsLoadError);

			throw secretsLoadError;
		}
	}

	private encryptSecret(secret: string): string {
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

		return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
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

	private getEncryptionKeyHash(): Buffer {
		return createHash('sha256').update(this.encryptionKey!).digest();
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
				console.error(`Secret ${key} not found`);
				secretsResult[key] = null;

				continue;
			}

			if (secretData.isDecrypted) {
				secretData.lastAccessed = Date.now();
				secretsResult[key] = secretData.value;
			} else {
				const decryptedSecret = this.decryptSecret(secretData.value);

				this.secrets.set(key, {
					value: decryptedSecret,
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

	public reEncryptSecret(secretKey: string): void {
		const secretData = this.secrets.get(secretKey);

		if (!secretData || !secretData.isDecrypted) {
			return;
		}

		const currentTime = Date.now();
		const isTimeElapsed = currentTime - secretData.lastAccessed;

		if (isTimeElapsed < this.reEncryptionCooldown) {
			const encryptedSecret = this.encryptSecret(secretData.value);

			this.secrets.set(secretKey, {
				value: encryptedSecret,
				isDecrypted: false,
				lastAccessed: Date.now()
			});
		}
	}

	public releaseSecret(secretKey: string): void {
		this.reEncryptSecret(secretKey);
	}

	public refreshSecrets(dependencies: SecretsDependencies): void {
		this.loadSecrets(dependencies);
	}
}

export const envSecretsStore = SecretsStore.getInstance();
