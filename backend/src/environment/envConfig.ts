import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes
} from 'crypto';
import { getSecretsSync, SecretsDependencies } from './envSecrets';
import {
	envVariables,
	EnvVariableTypes,
	FeatureFlagTypes,
	getFeatureFlags
} from './envVars';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';

export class ConfigStore {
	private static instance: ConfigStore;
	private config: EnvVariableTypes;
	private featureFlags: FeatureFlagTypes;

	private constructor() {
		this.config = envVariables;
		this.featureFlags = getFeatureFlags(process.env);
	}

	public static getInstance(): ConfigStore {
		if (!ConfigStore.instance) {
			ConfigStore.instance = new ConfigStore();
		}
		return ConfigStore.instance;
	}

	public getEnvVariables(): EnvVariableTypes {
		return this.config;
	}

	public getFeatureFlags(): FeatureFlagTypes {
		return this.featureFlags;
	}
}

export class SecretsStore {
	private static instance: SecretsStore;
	private secrets: Map<
		string,
		{ value: string; isDecrypted: boolean; lastAccessed: number }
	> | null = null;
	private encryptionKey: string | null = null;
	private reEncryptionCooldown: number; // in ms

	private constructor(reEncryptionCooldown: number = 30000) {
		this.reEncryptionCooldown = reEncryptionCooldown;
	}

	public static getInstance(): SecretsStore {
		if (!SecretsStore.instance) {
			SecretsStore.instance = new SecretsStore();
		}
		return SecretsStore.instance;
	}

	public initializeEncryptionKey(encryptionKey: string): void {
		this.encryptionKey = encryptionKey;
	}

	public prepareSecrets(dependencies: SecretsDependencies): void {
		if (this.secrets) {
			return;
		}

		try {
			const decryptedSecrets = getSecretsSync(
				dependencies,
				this.encryptionKey!
			);
			this.secrets = new Map();

			for (const key in decryptedSecrets) {
				const encryptedSecret = this.encryptSecret(
					decryptedSecrets[key]
				);
				this.secrets.set(key, {
					value: encryptedSecret,
					isDecrypted: false,
					lastAccessed: Date.now()
				});
			}
		} catch (error) {
			const secretsLoadError = new errorClasses.ConfigurationErrorFatal(
				`Failed to load secrets: ${error instanceof Error ? error.message : String(error)}`,
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
		const iv = randomBytes(16);
		const cipher = createCipheriv(
			'aes-256-ctr',
			this.getEncryptionKeyHash(),
			iv
		);
		const encrypted = Buffer.concat([
			cipher.update(secret, 'utf8'),
			cipher.final()
		]);

		const encryptedData = Buffer.concat([iv, encrypted]);

		return encryptedData.toString('hex');
	}

	private decryptSecret(encryptedSecret: string): string {
		const encryptedData = Buffer.from(encryptedSecret, 'hex');

		const iv = encryptedData.slice(0, 16);
		const encryptedText = encryptedData.slice(16);

		const decipher = createDecipheriv(
			'aes-256-ctr',
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

	public getSecret(secretKey: string): string | null {
		const secretData = this.secrets?.get(secretKey);
		if (!secretData) {
			console.error(`Secret ${secretKey} not found`);
			return null;
		}

		if (secretData.isDecrypted) {
			secretData.lastAccessed = Date.now();
			return secretData.value;
		} else {
			const decryptedSecret = this.decryptSecret(secretData.value);
			this.secrets!.set(secretKey, {
				value: decryptedSecret,
				isDecrypted: true,
				lastAccessed: Date.now()
			});
			return decryptedSecret;
		}
	}

	public reEncryptSecret(secretKey: string): void {
		const secretData = this.secrets?.get(secretKey);
		if (!secretData || !secretData.isDecrypted) {
			return;
		}

		const currentTime = Date.now();
		const timeElapsed = currentTime - secretData.lastAccessed;
		if (timeElapsed >= this.reEncryptionCooldown) {
			const encryptedSecret = this.encryptSecret(secretData.value);
			this.secrets!.set(secretKey, {
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
		this.prepareSecrets(dependencies);
	}
}

export const envVariablesStore = ConfigStore.getInstance();
export const envSecretsStore = SecretsStore.getInstance();

export function initializeSecrets(
	initializeSecretsDependencies: SecretsDependencies
): void {
	envSecretsStore.prepareSecrets(initializeSecretsDependencies);
}
