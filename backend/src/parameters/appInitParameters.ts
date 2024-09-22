import { configService } from '../services/configService';
import { AuthenticateOptions } from 'passport';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import { expressErrorHandler } from '../errors/processError';
import { getRedisClient } from '../services/redis';
import hpp from 'hpp';
import { initializeCsrfMiddleware } from '../middleware/csrf';
import { initializeIpBlacklistMiddleware } from '../middleware/ipBlacklist';
import { initializeJwtAuthMiddleware } from '../middleware/jwtAuth';
import { initializePassportAuthMiddleware } from '../middleware/passportAuth';
import { initializeRateLimitMiddleware } from '../middleware/rateLimit';
import { initializeSecurityHeaders } from '../middleware/securityHeaders';
import { initializeSlowdownMiddleware } from '../middleware/slowdown';
import { initializeValidatorMiddleware } from '../middleware/validator';
import morgan from 'morgan';
import passport from 'passport';
import { processError } from '../errors/processError';
import session from 'express-session';
import { randomBytes } from 'crypto';
import { getRedisClient as redisClient } from '../services/redis';
import { createJwt } from '../auth/jwt';
import RedisStore from 'connect-redis';

export const InitMiddlewareParameters = {
	appLogger: configService.getAppLogger(),
	authenticateOptions: { session: false },
	configService,
	cookieParser,
	cors,
	express,
	expressErrorHandler,
	fsModule: fs.promises,
	getRedisClient,
	hpp,
	initializeCsrfMiddleware,
	initializeIpBlacklistMiddleware,
	initializeJwtAuthMiddleware,
	initializePassportAuthMiddleware,
	initializeRateLimitMiddleware,
	initializeSecurityHeaders,
	initializeSlowdownMiddleware,
	initializeValidatorMiddleware,
	morgan,
	passport,
	processError,
	session,
	randomBytes,
	redisClient,
	RedisStore,
	verifyJwt: createJwt(configService.getAppLogger()).verifyJwt
}
