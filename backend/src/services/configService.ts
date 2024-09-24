import { execSync } from 'child_process';
import { ConfigStore, envSecretsStore } from '../environment/envConfig';
import {
	ConfigSecretsInterface,
	ConfigServiceInterface,
	EnvVariableTypes,
	FeatureFlagTypes,
	SecretsMap
} from '../index/interfaces';
import { loadEnv } from '../environment/envVars';
import { AppLogger, ErrorLogger } from './logger';
import { AppLoggerInterface } from '../index/interfaces';

export class ConfigService implements ConfigServiceInterface {
	private static instance: ConfigService;
	private envVariablesStore = ConfigStore.getInstance();
	private encryptionKey: string | null = null;
	private gpgPassphrase: string | undefined;
	private adminId: number | null = null;
	public logger: AppLoggerInterface;

	private constructor() {
		loadEnv();
		this.logger = AppLogger.getInstance().getRedactedLogger();
	}

	public initialize(
		encryptionKey: string,
		gpgPassphrase: string,
		adminId: number
	): void {
		this.encryptionKey = encryptionKey;
		this.gpgPassphrase = gpgPassphrase;
		this.adminId = adminId;
		this.initializeSecrets({
			execSync,
			getDirectoryPath: () => process.cwd(),
			logger: this.getAppLogger(),
			gpgPassphrase: this.gpgPassphrase
		});
	}

	public static getInstance(): ConfigService {
		if (!ConfigService.instance) {
			ConfigService.instance = new ConfigService();
		}
		return ConfigService.instance;
	}

	public initializeLogger(): void {
		AppLogger.getInstance().getRedactedLogger().info('Logger initialized');
	}

	public getAppLogger(): AppLoggerInterface {
		return this.logger;
	}

	public getErrorLogger(): AppLoggerInterface {
		return ErrorLogger.getInstance().getRedactedLogger();
	}

	public getAdminId(): number | null {
		return this.adminId;
	}

	public getEnvVariables(): EnvVariableTypes {
		return this.envVariablesStore.getEnvVariables();
	}

	public getFeatureFlags(): FeatureFlagTypes {
		return this.envVariablesStore.getFeatureFlags();
	}

	public getSecrets(
		keys: keyof SecretsMap | (keyof SecretsMap)[],
		appLogger: AppLoggerInterface
	): Record<string, string | undefined> | string | undefined {
		let result = envSecretsStore.retrieveSecrets(
			Array.isArray(keys)
				? keys.map(key => key.toString())
				: keys.toString(),
			appLogger
		);

		if (!this.gpgPassphrase) {
			throw new Error('GPG passphrase not found');
		}

		if (
			result === null ||
			(typeof result === 'object' &&
				Object.values(result).some(value => value === null))
		) {
			this.logger.warn(
				`Secret(s) not found, attempting to refresh secrets.`
			);
			this.refreshSecrets({
				logger: this.getAppLogger(),
				execSync,
				getDirectoryPath: () => process.cwd(),
				gpgPassphrase: this.gpgPassphrase
			});

			result = envSecretsStore.retrieveSecrets(
				Array.isArray(keys)
					? keys.map(key => key.toString())
					: keys.toString(),
				appLogger
			);
		}

		if (result === null) {
			this.logger.error(
				`Secret(s) ${keys} still not found after refreshing.`
			);
			return undefined;
		}

		if (typeof result === 'object') {
			const transformedResult: Record<string, string | undefined> = {};
			for (const key in result) {
				transformedResult[key] =
					result[key] === null ? undefined : (result[key] as string);
			}
			return transformedResult;
		}

		return result === null ? undefined : result;
	}

	private initializeSecrets(dependencies: ConfigSecretsInterface): void {
		if (
			!this.encryptionKey ||
			!this.gpgPassphrase ||
			this.encryptionKey.length === 0 ||
			this.gpgPassphrase.length === 0
		) {
			throw new Error('Encryption key or GPG passphrase is not set');
		}

		try {
			envSecretsStore.initializeEncryptionKey(this.encryptionKey);
			envSecretsStore.loadSecrets(dependencies);
			this.logger.info('Secrets loaded and ready to go');
		} catch (error) {
			this.logger.error('Failed to load secrets', { error });

			throw error;
		}
	}

	public refreshSecrets(dependencies: ConfigSecretsInterface): void {
		if (!this.gpgPassphrase) {
			throw new Error('GPG passphrase not found');
		}

		try {
			envSecretsStore.refreshSecrets(dependencies);
			this.logger.info('Secrets refreshed successfully');
		} catch (error) {
			this.logger.error('Failed to refresh secrets', { error });

			throw error;
		}
	}
}

export const configService = ConfigService.getInstance();
