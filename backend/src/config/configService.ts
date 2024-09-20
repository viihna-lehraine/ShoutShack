import { execSync } from 'child_process';
import { ConfigStore, envSecretsStore } from '../environment/envConfig';
import { SecretsMap, SecretsDependencies } from '../environment/envSecrets';
import { loadEnv } from '../environment/envVars';
import { appLogger, logWithMaskedSecrets, setupLogger } from '../utils/appLogger';

class ConfigService {
	private static instance: ConfigService;
	private envVariablesStore = ConfigStore.getInstance();
	private appLogger: appLogger = setupLogger();
	private encryptionKey: string | null = null;

	private constructor() {
		loadEnv();
	}

	public initialize(encryptionKey: string) {
		this.encryptionKey = encryptionKey;
		this.initializeSecrets({
			appLogger: this.appLogger,
			execSync,
			getDirectoryPath: () => process.cwd()
		});
	}

	public static getInstance(): ConfigService {
		if (!ConfigService.instance) {
			ConfigService.instance = new ConfigService();
		}
		return ConfigService.instance;
	}

	public getLogger() {
		return {
			log: (level: string, message: string, meta?: Record<string, unknown>) => {
				logWithMaskedSecrets(level, message, meta);
			},
			debug: (message: string, meta?: Record<string, unknown>) => {
				logWithMaskedSecrets('debug', message, meta);
			},
			info: (message: string, meta?: Record<string, unknown>) => {
				logWithMaskedSecrets('info', message, meta);
			},
			warn: (message: string, meta?: Record<string, unknown>) => {
				logWithMaskedSecrets('warn', message, meta);
			},
			error: (message: string, meta?: Record<string, unknown>) => {
				logWithMaskedSecrets('error', message, meta);
			},
			critical: (message: string, meta?: Record<string, unknown>) => {
				logWithMaskedSecrets('critical', message, meta);
			}
		};
	}

	public getEnvVariables() {
		return this.envVariablesStore.getEnvVariables();
	}

	public getFeatureFlags() {
		return this.envVariablesStore.getFeatureFlags();
	}

	public getSecrets(keys: keyof SecretsMap | (keyof SecretsMap)[]): Record<string, string | undefined> | string | undefined {
		let result = envSecretsStore.retrieveSecrets(
			Array.isArray(keys) ? keys.map(key => key.toString()) : keys.toString()
		);

		if (result === null || (typeof result === 'object' && Object.values(result).some(value => value === null))) {
			this.appLogger.warn(`Secret(s) not found, attempting to refresh secrets.`);
			this.refreshSecrets({
				appLogger: this.appLogger,
				execSync,
				getDirectoryPath: () => process.cwd(),
			});

			result = envSecretsStore.retrieveSecrets(
				Array.isArray(keys) ? keys.map(key => key.toString()) : keys.toString()
			);
		}

		if (result === null) {
			this.appLogger.error(`Secret(s) ${keys} still not found after refreshing.`);
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
		if (!this.encryptionKey) {
			throw new Error('Encryption key is not set');
		}

		try {
			envSecretsStore.initializeEncryptionKey(this.encryptionKey);
			envSecretsStore.loadSecrets(dependencies);
			this.appLogger.info('Secrets loaded successfully');
		} catch (error) {
			this.appLogger.error('Failed to load secrets', { error });

			throw error;
		}
	}

	public refreshSecrets(dependencies: SecretsDependencies): void {
		try {
			envSecretsStore.refreshSecrets(dependencies);
			this.appLogger.info('Secrets refreshed successfully');
		} catch (error) {
			this.appLogger.error('Failed to refresh secrets', { error });

			throw error;
		}
	}
}

export const configService = ConfigService.getInstance();
