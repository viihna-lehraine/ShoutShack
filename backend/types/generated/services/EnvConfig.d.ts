import { EnvVariableTypes, FeatureFlagTypes } from '../index/interfaces/env';
import { EnvConfigServiceInterface } from '../index/interfaces/main';
export declare const __filename: string;
export declare const __dirname: string;
export declare class EnvConfigService implements EnvConfigServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private constructor();
    static getInstance(): Promise<EnvConfigService>;
    private loadEnv;
    getEnvVariable<K extends keyof EnvVariableTypes>(key: K): EnvVariableTypes[K];
    private parseEnvValue;
    getFeatureFlags(): FeatureFlagTypes;
    private parseBoolean;
    private clearAllEnvVariables;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=EnvConfig.d.ts.map