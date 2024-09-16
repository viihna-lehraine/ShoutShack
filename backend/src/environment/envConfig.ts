import {
	getSecretsSync,
	EnvSecretsMap,
	EnvSecretsDependencies
} from './envSecrets';
import {
	envVariables,
	EnvVariableTypes,
	FeatureFlagTypes,
	getFeatureFlags
} from './envVars';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';

export class EnvVariablesStore {
	private static instance: EnvVariablesStore;
	private envVariables: EnvVariableTypes;
	private featureFlags: FeatureFlagTypes;

	private constructor() {
		this.envVariables = envVariables;
		this.featureFlags = getFeatureFlags(console, process.env);
	}

	public static getInstance(): EnvVariablesStore {
		if (!EnvVariablesStore.instance) {
			EnvVariablesStore.instance = new EnvVariablesStore();
		}
		return EnvVariablesStore.instance;
	}

	public getEnvVariables(): EnvVariableTypes {
		return this.envVariables;
	}

	public getFeatureFlags(): FeatureFlagTypes {
		return this.featureFlags;
	}
}

export class EnvSecretsStore {
	private static instance: EnvSecretsStore;
	private secrets: EnvSecretsMap | null = null;

	private constructor() {}

	public static getInstance(): EnvSecretsStore {
		if (!EnvSecretsStore.instance) {
			EnvSecretsStore.instance = new EnvSecretsStore();
		}
		return EnvSecretsStore.instance;
	}

	public loadSecrets(dependencies: EnvSecretsDependencies): void {
		if (this.secrets) {
			return;
		}

		try {
			const secrets = getSecretsSync(dependencies);
			this.secrets = secrets;
		} catch (error) {
			const secretsLoadError = new errorClasses.ConfigurationError(
				`Failed to load secrets: ${error instanceof Error ? error.message : String(error)}`,
				{ statusCode: 500, exposeToClient: false }
			);
			ErrorLogger.logError(secretsLoadError, dependencies.appLogger);
			processError(secretsLoadError, dependencies.appLogger);
			throw secretsLoadError;
		}
	}

	public getEnvSecrets(): EnvSecretsMap | null {
		return this.secrets;
	}

	public async refreshSecrets(
		dependencies: EnvSecretsDependencies
	): Promise<void> {
		try {
			const newEnvSecrets = getSecretsSync(dependencies);
			this.secrets = newEnvSecrets;
		} catch (configError) {
			const refreshError = new errorClasses.ConfigurationError(
				`Failed to refresh secrets: ${configError instanceof Error ? configError.message : String(configError)}`,
				{ statusCode: 500, exposeToClient: false }
			);
			ErrorLogger.logError(refreshError, dependencies.appLogger);
			processError(refreshError, dependencies.appLogger);
			throw refreshError;
		}
	}
}
// export initialized variable stores
export const envVariablesStore = EnvVariablesStore.getInstance();
export const envSecretsStore = EnvSecretsStore.getInstance();

// loads env variables, loads secrets, and initializes feature flags
export function initializeEnvConfig(depenencies: EnvSecretsDependencies): void {
	envSecretsStore.loadSecrets(depenencies);
}

// Optional configuration extensions to implement later

// this should be enabled based on a flag stored in another master .env file
/*
export class EnvVariablesStore {

	...existing code

	// update envVariables at runtime
	public updateEnvVariables(
		newEnvVars: Partial<EnvironmenVariableTypes>
	): void {
		this.envVariables = { ...this.envVariables, ...newEnvVars };
	}

	// update featureFlags at runtime
	public updateFeatureFlags(newFlags: Partial<FeatureFlags>): void {
		this.featureFlags = { ...this.featureFlags, ...newFlags };
	}

	// refresh envVariables from the .env file
	public refreshEnvVariables() {
		loadEnv();
		this.envVariables = { ...envVariables };

	// refresh featureFlags from the .env file
	public refreshFeatureFlags() {
		getFeatureFlags({ logger }}

	...terminate class declaration here
}
*/
