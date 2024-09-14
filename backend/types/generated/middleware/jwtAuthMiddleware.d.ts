import { NextFunction, Request, Response } from 'express';
interface JwtAuthMiddlewareDependencies {
    logger: ReturnType<typeof import('../utils/logger').default>;
    featureFlags: ReturnType<typeof import('../utils/featureFlags').getFeatureFlags>;
    verifyJwToken: (token: string) => Promise<string | object | null>;
}
export declare const createJwtAuthMiddleWare: ({ logger, featureFlags, verifyJwToken }: JwtAuthMiddlewareDependencies) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=jwtAuthMiddleware.d.ts.map
