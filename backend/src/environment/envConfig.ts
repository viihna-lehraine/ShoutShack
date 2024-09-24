import { ConfigSecretsInterface } from '../index/interfaces';
import { EnvVariableTypes, FeatureFlagTypes } from '../index/interfaces';
import { SecretsStore } from './envSecrets';
import { ConfigService } from '../services/configService';

export class ConfigStore {
	private static instance: ConfigStore;
	private config: EnvVariableTypes;
	private featureFlags: FeatureFlagTypes;

	private constructor() {
		this.config = ConfigService.getInstance().getEnvVariables();
		this.featureFlags = ConfigService.getInstance().getFeatureFlags();
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
	initializeSecretsDependencies: ConfigSecretsInterface
): void {
	envSecretsStore.loadSecrets(initializeSecretsDependencies);
}
