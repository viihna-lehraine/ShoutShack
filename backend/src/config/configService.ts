import { execSync } from 'child_process';
import { ConfigStore, envSecretsStore } from '../environment/envConfig';
import { SecretsMap, SecretsDependencies } from '../environment/envSecrets';
import { loadEnv } from '../environment/envVars';
import { AppLogger, createRedactedLogger, setUpLogger } from '../utils/appLogger';

class ConfigService {
	private static instance: ConfigService;
	private envVariablesStore = ConfigStore.getInstance();
	private encryptionKey: string | null = null;
	private gpgPassphrase: string | undefined;
	private logger: AppLogger;

	private constructor() {
		loadEnv();
		this.logger = createRedactedLogger(setUpLogger());
	}

	public initialize(encryptionKey: string, gpgPassphrase: string): void {
		this.encryptionKey = encryptionKey;
		this.gpgPassphrase = gpgPassphrase;
		this.initializeSecrets({
			execSync,
			getDirectoryPath: () => process.cwd(),
			appLogger: this.logger
		});
	}

	public static getInstance(): ConfigService {
		if (!ConfigService.instance) {
			ConfigService.instance = new ConfigService();
		}
		return ConfigService.instance;
	}

	public getAppLogger(): AppLogger {
		return this.logger!
	}

	public getEnvVariables() {
		return this.envVariablesStore.getEnvVariables();
	}

	public getFeatureFlags() {
		return this.envVariablesStore.getFeatureFlags();
	}

	public getSecrets(keys: keyof SecretsMap | (keyof SecretsMap)[], appLogger: AppLogger): Record<string, string | undefined> | string | undefined {
		let result = envSecretsStore.retrieveSecrets(
			Array.isArray(keys) ? keys.map(key => key.toString()) : keys.toString(),
			appLogger
		);

		if (result === null || (typeof result === 'object' && Object.values(result).some(value => value === null))) {
			this.logger.warn(`Secret(s) not found, attempting to refresh secrets.`);
			this.refreshSecrets({
				appLogger: this.logger,
				execSync,
				getDirectoryPath: () => process.cwd(),
			});

			result = envSecretsStore.retrieveSecrets(
				Array.isArray(keys) ? keys.map(key => key.toString()) : keys.toString(),
				appLogger
			);
		}

		if (result === null) {
			this.logger.error(`Secret(s) ${keys} still not found after refreshing.`);
			return undefined;
		}

		if (typeof result === 'object') {
			const transformedResult: Record<string, string | undefined> = {};
			for (const key in result) {
				transformedResult[key] = result[key] === null ? undefined : result[key] as string;
			}
			return transformedResult;
		}

		return result === null ? undefined : result;
	}

	private initializeSecrets(dependencies: SecretsDependencies): void {
		if (!this.encryptionKey || !this.gpgPassphrase || this.encryptionKey.length === 0 || this.gpgPassphrase.length === 0) {
			throw new Error('Encryption key or GPG passphrase is not set');
		}

		try {
			envSecretsStore.initializeEncryptionKey(this.encryptionKey);
			envSecretsStore.loadSecrets(dependencies, this.gpgPassphrase);
			this.logger.info('Secrets loaded and ready to go');
		} catch (error) {
			this.logger.error('Failed to load secrets', { error });

			throw error;
		}
	}

	public refreshSecrets(dependencies: SecretsDependencies): void {
		if (!this.gpgPassphrase) {
			throw new Error('GPG passphrase not found');
		}

		try {
			envSecretsStore.refreshSecrets(dependencies, this.gpgPassphrase);
			this.logger.info('Secrets refreshed successfully');
		} catch (error) {
			this.logger.error('Failed to refresh secrets', { error });

			throw error;
		}
	}
}

export const configService = ConfigService.getInstance();
