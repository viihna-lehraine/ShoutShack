import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import { HelmetOptions } from 'helmet';
import { randomBytes } from 'crypto';
import path from 'path';
import RedisStore from 'connect-redis';
interface AppDependencies {
    express: typeof express;
    session: typeof session;
    cookieParser: typeof cookieParser;
    cors: typeof cors;
    hpp: typeof hpp;
    morgan: typeof morgan;
    passport: typeof passport;
    randomBytes: typeof randomBytes;
    path: typeof path;
    RedisStore: typeof RedisStore;
    initializeStaticRoutes: (app: Application) => void;
    csrfMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
    getRedisClient: () => any;
    ipBlacklistMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    createTestRouter: (app: Application) => void;
    rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    setupSecurityHeaders: (app: Application, options: {
        helmetOptions?: HelmetOptions;
        permissionsPolicyOptions?: any;
    }) => void;
    startMemoryMonitor: () => NodeJS.Timeout;
    logger: any;
    staticRootPath: string;
    NODE_ENV: string | undefined;
    SSL_FLAG: boolean;
    REDIS_FLAG: boolean;
}
declare function initializeApp({ express, session, cookieParser, cors, hpp, morgan, passport, randomBytes, path, RedisStore, initializeStaticRoutes, csrfMiddleware, errorHandler, getRedisClient, ipBlacklistMiddleware, createTestRouter, rateLimitMiddleware, setupSecurityHeaders, startMemoryMonitor, logger, staticRootPath, NODE_ENV, SSL_FLAG, REDIS_FLAG, }: AppDependencies): Promise<Application>;
export { initializeApp };
//# sourceMappingURL=app.d.ts.map