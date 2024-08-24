import { Request, Response, NextFunction } from 'express';
export declare const loadBlacklist: () => Promise<void>;
export declare const addToBlacklist: (ip: string) => void;
export declare const ipBlacklistMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const removeFromBlacklist: (ip: string) => void;
export declare const initializeIpBlacklist: () => Promise<void>;
//# sourceMappingURL=ipBlacklist.d.ts.map