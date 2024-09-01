import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
interface IpBlacklistDependencies {
    logger: ReturnType<typeof import('../config/logger').default>;
    featureFlags: ReturnType<typeof import('../config/featureFlags').getFeatureFlags>;
    __dirname: string;
    fsModule: typeof fs;
}
interface IpBlacklist {
    initializeBlacklist: () => Promise<void>;
    loadBlacklist: () => Promise<void>;
    addToBlacklist: (ip: string) => Promise<void>;
    ipBlacklistMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    removeFromBlacklist: (ip: string) => void;
}
export declare function createIpBlacklist({ logger, featureFlags, __dirname, fsModule }: IpBlacklistDependencies): IpBlacklist;
export declare const initializeIpBlacklist: typeof createIpBlacklist;
export {};
//# sourceMappingURL=ipBlacklist.d.ts.map