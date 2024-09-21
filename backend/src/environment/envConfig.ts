import { SecretsDependencies } from './envSecrets';
import {
	envVariables,
	EnvVariableTypes,
	FeatureFlagTypes,
	getFeatureFlags
} from './envVars';
import { SecretsStore } from './envSecrets';

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
	initializeSecretsDependencies: SecretsDependencies,
	gpgPassphrase: string
): void {
	envSecretsStore.loadSecrets(initializeSecretsDependencies, gpgPassphrase);
}
