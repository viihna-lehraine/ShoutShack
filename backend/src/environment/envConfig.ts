import { SecretsDependencies } from './envSecrets';
import {
	envVariables,
	EnvVariableTypes,
	FeatureFlagTypes,
	getFeatureFlags
} from './envVars';
import { SecretsStore } from './envSecrets';

// stores variables from .env file, including feature flags
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

export const envVariablesStore = ConfigStore.getInstance();
export const envSecretsStore = SecretsStore.getInstance();

export function initializeSecrets(
	initializeSecretsDependencies: SecretsDependencies
): void {
	envSecretsStore.loadSecrets(initializeSecretsDependencies);
}
