import { promises as fs } from 'fs';

export interface InitMiddlewareParameters {
	appLogger: import('../services/appLogger').AppLogger;
	authenticateOptions: import('passport').AuthenticateOptions;
	configService: typeof import('../services/configService').configService;
	cookieParser: typeof import('cookie-parser');
	cors: typeof import('cors');
	express: typeof import('express');
	expressErrorHandler: import('./errorInterfaces').ExpressErrorHandlerInterface;
	fsModule: typeof fs;
	getRedisClient: typeof import('../services/redis').getRedisClient;
	hpp: typeof import('hpp');
	initializeCsrfMiddleware: typeof import('../middleware/csrf').initializeCsrfMiddleware;
	initializeIpBlacklistMiddleware: typeof import('../middleware/ipBlacklist').initializeIpBlacklistMiddleware;
	initializeJwtAuthMiddleware: typeof import('../middleware/jwtAuth').initializeJwtAuthMiddleware;
	initializePassportAuthMiddleware: typeof import('../middleware/passportAuth').initializePassportAuthMiddleware;
	initializeRateLimitMiddleware: typeof import('../middleware/rateLimit').initializeRateLimitMiddleware;
	initializeSecurityHeaders: typeof import('../middleware/securityHeaders').initializeSecurityHeaders;
	initializeSlowdownMiddleware: typeof import('../middleware/slowdown').initializeSlowdownMiddleware;
	initializeValidatorMiddleware: typeof import('../middleware/validator').initializeValidatorMiddleware;
	morgan: typeof import('morgan');
	passport: typeof import('passport');
	processError: typeof import('../errors/processError').processError;
	session: typeof import('express-session');
	randomBytes: typeof import('crypto').randomBytes;
	redisClient: typeof import('../services/redis').getRedisClient;
	RedisStore: typeof import('connect-redis').RedisStore;
	verifyJwt: (token: string) => Promise<string | object | null>;
}

export interface InitExpressMiddlware {
	app: import('express').Application;
	middleware: import('express').RequestHandler;
	middlewareName: string;
}

export interface RouteParams {
	app: import('express').Application;
	appLogger: import('../services/appLogger').AppLogger;
	configService: typeof import('../services/configService').configService;
}

export interface InitDatabase {
	appLogger: import('../services/appLogger').AppLogger;
	configService: typeof import('../services/configService').configService;
	maxRetries: number;
	retryAfter: number;
}
