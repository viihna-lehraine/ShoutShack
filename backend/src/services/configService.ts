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
import {
	AppLoggerServiceInterface,
	ErrorLoggerServiceInterface
} from '../index/interfaces';
import { ServiceFactory } from 'src/index/serviceFactory';

export class ConfigService implements ConfigServiceInterface {
	private static instance: ConfigService;
	private envVariablesStore = ConfigStore.getInstance();
	private encryptionKey: string | null = null;
	private gpgPassphrase: string | undefined;
	private adminId: number | null = null;
	public logger: AppLoggerServiceInterface;

	private constructor() {
		loadEnv();
		this.logger = ServiceFactory.createService(
			'logger'
		) as AppLoggerServiceInterface;
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
			logger: this.getLogger(),
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
		this.logger.getRedactedLogger().info('Logger initialized');
	}

	public getLogger(): AppLoggerServiceInterface {
		return this.logger;
	}

	public getErrorLogger(): ErrorLoggerServiceInterface {
		return ServiceFactory.createService(
			'errorLogger'
		) as ErrorLoggerServiceInterface;
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
		keys: keyof SecretsMap | (keyof SecretsMap)[]
	): Record<string, string | undefined> | string | undefined {
		let result = envSecretsStore.retrieveSecrets(
			Array.isArray(keys)
				? keys.map(key => key.toString())
				: keys.toString()
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
				logger: this.getLogger(),
				execSync,
				getDirectoryPath: () => process.cwd(),
				gpgPassphrase: this.gpgPassphrase
			});

			result = envSecretsStore.retrieveSecrets(
				Array.isArray(keys)
					? keys.map(key => key.toString())
					: keys.toString()
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
