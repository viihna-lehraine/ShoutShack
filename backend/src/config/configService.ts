import { execSync } from 'child_process';
import { ConfigStore } from '../environment/envConfig';
import { getSecretsSync, SecretsMap, SecretsDependencies } from '../environment/envSecrets';
import { loadEnv } from '../environment/envVars';
import { appLogger, logWithMaskedSecrets, setupLogger } from '../utils/appLogger';

class ConfigService {
	private static instance: ConfigService;
  	private envVariablesStore = ConfigStore.getInstance();
  	private secrets: SecretsMap | null = null;
  	private appLogger: appLogger = setupLogger();

	private constructor() {
		loadEnv();
		this.loadSecrets({
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


	public getSpecificSecret(key: keyof SecretsMap): string | number | undefined {
		return this.secrets ? this.secrets[key]: undefined;
	}

	private loadSecrets(dependencies: SecretsDependencies): void {
		try {
			const secrets = getSecretsSync(dependencies);
			this.secrets = secrets;

			logWithMaskedSecrets('info', 'Secrets loaded successfully', this.secrets as unknown as Record<string, unknown>);
		} catch (error) {
			logWithMaskedSecrets('error', 'Failed to load secrets', { error });
			throw error;
		}
	}
}

export const configService = ConfigService.getInstance();

