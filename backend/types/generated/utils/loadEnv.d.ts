export interface LoadEnvDependencies {
    logger: {
        info: (msg: string) => void;
    };
    envFilePath?: string;
}
export declare function loadEnv({ logger, envFilePath }: LoadEnvDependencies): void;
//# sourceMappingURL=loadEnv.d.ts.map