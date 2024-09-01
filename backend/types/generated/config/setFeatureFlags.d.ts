import { Logger } from 'winston';
export declare function createFeatureEnabler(logger: Logger): {
    enableFeatureBasedOnFlag(flag: boolean, description: string, callback: () => void): void;
    enableFeatureWithProdOverride(flag: boolean, description: string, callback: () => void): void;
};
//# sourceMappingURL=setFeatureFlags.d.ts.map