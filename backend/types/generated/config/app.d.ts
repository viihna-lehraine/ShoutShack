import express, { Application } from 'express';
import session from 'express-session';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import path from 'path';
import passport from 'passport';
import RedisStore from 'connect-redis';
import { randomBytes } from 'crypto';
import { setupSecurityHeaders } from '../middleware/securityHeaders';
import { initializeStaticRoutes } from '../routes/staticRoutes';
import errorHandler from '../middleware/errorHandler';
import { createCsrfMiddleware } from '../middleware/csrf';
import { getRedisClient } from '../config/redis';
import { createIpBlacklist } from '../middleware/ipBlacklist';
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
    initializeStaticRoutes: typeof initializeStaticRoutes;
    csrfMiddleware: ReturnType<typeof createCsrfMiddleware>;
    errorHandler: typeof errorHandler;
    getRedisClient: typeof getRedisClient;
    ipBlacklistMiddleware: ReturnType<typeof createIpBlacklist>['ipBlacklistMiddleware'];
    createTestRouter: (app: Application) => void;
    rateLimitMiddleware: any;
    setupSecurityHeaders: typeof setupSecurityHeaders;
    startMemoryMonitor: () => void;
    logger: any;
    staticRootPath: string;
}
export declare function initializeApp({ express, session, cookieParser, cors, hpp, morgan, passport, randomBytes, path, RedisStore, initializeStaticRoutes, csrfMiddleware, errorHandler, getRedisClient, ipBlacklistMiddleware, createTestRouter, rateLimitMiddleware, setupSecurityHeaders, startMemoryMonitor, logger, staticRootPath }: AppDependencies): Promise<Application>;
export {};
//# sourceMappingURL=app.d.ts.map