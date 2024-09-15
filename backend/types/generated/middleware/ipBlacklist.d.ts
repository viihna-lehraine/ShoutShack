import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { environmentVariables, FeatureFlags } from '../config/envConfig';
import { Logger } from '../utils/logger';
interface IpBlacklistDependencies {
    logger: Logger;
    featureFlags: FeatureFlags;
    environmentVariables: typeof environmentVariables;
    fsModule: typeof fs.promises;
}
export declare const loadBlacklist: ({ logger, fsModule, environmentVariables }: IpBlacklistDependencies) => Promise<void>;
export declare const initializeBlacklist: (deps: IpBlacklistDependencies) => Promise<void>;
export declare const addToBlacklist: (ip: string, deps: IpBlacklistDependencies) => Promise<void>;
export declare const removeFromBlacklist: (ip: string, deps: IpBlacklistDependencies) => Promise<void>;
export declare const ipBlacklistMiddleware: (deps: IpBlacklistDependencies) => (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=ipBlacklist.d.ts.map
