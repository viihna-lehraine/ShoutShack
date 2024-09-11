import { execSync } from 'child_process';
import fsPromises from 'fs/promises';
import { initializeMiddleware } from './middleware.mjs';
import { setupHttpServer } from './server.mjs';
import { getSequelizeInstance, initializeDatabase } from './config/db.mjs';
import { environmentVariables, loadEnv } from './config/environmentConfig.mjs';
import { setupLogger } from './config/logger.mjs';
import configurePassport from './config/passport.mjs';
import sops from './utils/sops.mjs';
import { initializeModels } from './models/ModelsIndex.mjs';
import createUserModel from './models/User.mjs';
import passport from 'passport';
import argon2 from 'argon2';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import { constants, randomBytes } from 'crypto';
import RedisStore from 'connect-redis';
import { ipBlacklistMiddleware } from './middleware/ipBlacklist.mjs';
import { initializeRateLimitMiddleware } from './middleware/rateLimit.mjs';
import { initializeSecurityHeaders } from './middleware/securityHeaders.mjs';
import { expressErrorHandler } from './middleware/expressErrorHandler.mjs';
import { getRedisClient } from './config/redis.mjs';
import { initializeCsrfMiddleware } from './middleware/csrf.mjs';
import { createMemoryMonitor } from './middleware/memoryMonitor.mjs';
import os from 'os';
import process from 'process';
import { initializeRoutes } from './setupRoutes.mjs';
import { initializeValidatorMiddleware } from './middleware/validator.mjs';
import { initializeSlowdownMiddleware } from './middleware/slowdown.mjs';
import { processError } from './utils/processError.mjs';
import { validateDependencies } from './utils/validateDependencies.mjs';
let logger;
async function start() {
	try {
		loadEnv();
		const staticRootPath = environmentVariables.staticRootPath;
		logger = setupLogger();
		logger.info('Logger successfully initialized');
		const featureFlags = {};
		const memoryMonitor = createMemoryMonitor({
			logger,
			os,
			process,
			setInterval
		});
		const secrets = await sops.getSecrets({
			logger,
			execSync,
			getDirectoryPath: () => process.cwd()
		});
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'staticRootPath', instance: staticRootPath },
				{ name: 'featureFlags', instance: featureFlags }
			],
			logger
		);
		// test logger module writing functions in development
		if (environmentVariables.nodeEnv === 'development') {
			logger.debug('Testing logger levels...');
			console.log('Test log');
			console.info('Test info log');
			console.warn('Test warning');
			console.error('Test error');
			console.debug('Test debug log');
		}
		// database initialization
		logger.info('Initializing database');
		const sequelize = await initializeDatabase({
			logger,
			featureFlags,
			getSecrets: () =>
				sops.getSecrets({
					logger,
					execSync,
					getDirectoryPath: () => process.cwd()
				})
		});
		// models initialization
		logger.info('Initializing models');
		initializeModels(sequelize, logger);
		// passport initialization
		logger.info('Initializing passport');
		const UserModel = createUserModel(sequelize, logger);
		await configurePassport({
			passport,
			logger,
			getSecrets: () =>
				sops.getSecrets({
					logger,
					execSync,
					getDirectoryPath: () => process.cwd()
				}),
			UserModel,
			argon2
		});
		// middleware initialization
		logger.info('Initializing middleware');
		const app = await initializeMiddleware({
			express,
			session,
			cookieParser,
			cors,
			hpp,
			morgan,
			passport,
			randomBytes,
			RedisStore,
			initializeCsrfMiddleware,
			getRedisClient,
			ipBlacklistMiddleware,
			initializeRateLimitMiddleware,
			initializeSecurityHeaders,
			createMemoryMonitor: memoryMonitor.startMemoryMonitor,
			logger,
			staticRootPath,
			featureFlags,
			expressErrorHandler,
			processError,
			secrets,
			verifyJwt: passport.authenticate('jwt', { session: false }),
			initializeJwtAuthMiddleware: () =>
				passport.authenticate('jwt', { session: false }),
			initializePassportAuthMiddleware: () =>
				passport.authenticate('local'),
			authenticateOptions: { session: false },
			initializeValidatorMiddleware,
			initializeSlowdownMiddleware
		});
		// initialize routes
		logger.info('Initializing routes');
		initializeRoutes({
			app,
			logger,
			featureFlags,
			staticRootPath
		});
		// sync database if flag is enabled
		const dbSyncFlag = featureFlags?.dbSyncFlag ?? false;
		if (environmentVariables.nodeEnv === 'production' || dbSyncFlag) {
			logger.info('Syncing database models');
			await sequelize.sync();
			logger.info('Database and tables created!');
		}
		const redisClient = await getRedisClient();
		// set up HTTP/HTTPS server
		await setupHttpServer({
			app,
			sops,
			fs: fsPromises,
			logger,
			constants,
			featureFlags,
			getRedisClient: () => redisClient,
			getSequelizeInstance: () => getSequelizeInstance({ logger })
		});
	} catch (error) {
		if (!logger) {
			console.error(
				`Critical error before logger setup: ${error instanceof Error ? error.stack : error}`
			);
			processError(error, console);
			process.exit(1);
		} else {
			logger.error(
				`Critical error before logger setup: ${error instanceof Error ? error.stack : error}`
			);
			processError(error, logger);
			process.exit(1);
		}
	}
}
await start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sVUFBVSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDcEQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUMzQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDdkUsT0FBTyxFQUNOLG9CQUFvQixFQUVwQixPQUFPLEVBQ1AsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQVUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDdEQsT0FBTyxpQkFBaUIsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRCxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDeEQsT0FBTyxlQUFlLE1BQU0sZUFBZSxDQUFDO0FBQzVDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBQzlCLE9BQU8sT0FBTyxNQUFNLGlCQUFpQixDQUFDO0FBQ3RDLE9BQU8sWUFBWSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDO0FBQ3RCLE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNoRCxPQUFPLFVBQVUsTUFBTSxlQUFlLENBQUM7QUFDdkMsT0FBTyxFQUFFLHFCQUFx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RSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FDWix1Q0FBdUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQ3JGLENBQUM7WUFDRixZQUFZLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLENBQUMsS0FBSyxDQUNYLHVDQUF1QyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FDckYsQ0FBQztZQUNGLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDNUIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQixDQUFDO0lBQ0YsQ0FBQztBQUNGLENBQUM7QUFFRCxNQUFNLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBmc1Byb21pc2VzIGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCB7IGluaXRpYWxpemVNaWRkbGV3YXJlIH0gZnJvbSAnLi9taWRkbGV3YXJlJztcbmltcG9ydCB7IHNldHVwSHR0cFNlcnZlciB9IGZyb20gJy4vc2VydmVyJztcbmltcG9ydCB7IGdldFNlcXVlbGl6ZUluc3RhbmNlLCBpbml0aWFsaXplRGF0YWJhc2UgfSBmcm9tICcuL2NvbmZpZy9kYic7XG5pbXBvcnQge1xuXHRlbnZpcm9ubWVudFZhcmlhYmxlcyxcblx0RmVhdHVyZUZsYWdzLFxuXHRsb2FkRW52XG59IGZyb20gJy4vY29uZmlnL2Vudmlyb25tZW50Q29uZmlnJztcbmltcG9ydCB7IExvZ2dlciwgc2V0dXBMb2dnZXIgfSBmcm9tICcuL2NvbmZpZy9sb2dnZXInO1xuaW1wb3J0IGNvbmZpZ3VyZVBhc3Nwb3J0IGZyb20gJy4vY29uZmlnL3Bhc3Nwb3J0JztcbmltcG9ydCBzb3BzIGZyb20gJy4vdXRpbHMvc29wcyc7XG5pbXBvcnQgeyBpbml0aWFsaXplTW9kZWxzIH0gZnJvbSAnLi9tb2RlbHMvTW9kZWxzSW5kZXgnO1xuaW1wb3J0IGNyZWF0ZVVzZXJNb2RlbCBmcm9tICcuL21vZGVscy9Vc2VyJztcbmltcG9ydCBwYXNzcG9ydCBmcm9tICdwYXNzcG9ydCc7XG5pbXBvcnQgYXJnb24yIGZyb20gJ2FyZ29uMic7XG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCBzZXNzaW9uIGZyb20gJ2V4cHJlc3Mtc2Vzc2lvbic7XG5pbXBvcnQgY29va2llUGFyc2VyIGZyb20gJ2Nvb2tpZS1wYXJzZXInO1xuaW1wb3J0IGNvcnMgZnJvbSAnY29ycyc7XG5pbXBvcnQgaHBwIGZyb20gJ2hwcCc7XG5pbXBvcnQgbW9yZ2FuIGZyb20gJ21vcmdhbic7XG5pbXBvcnQgeyBjb25zdGFudHMsIHJhbmRvbUJ5dGVzIH0gZnJvbSAnY3J5cHRvJztcbmltcG9ydCBSZWRpc1N0b3JlIGZyb20gJ2Nvbm5lY3QtcmVkaXMnO1xuaW1wb3J0IHsgaXBCbGFja2xpc3RNaWRkbGV3YXJlIH0gZnJvbSAnLi9taWRkbGV3YXJlL2lwQmxhY2tsaXN0JztcbmltcG9ydCB7IGluaXRpYWxpemVSYXRlTGltaXRNaWRkbGV3YXJlIH0gZnJvbSAnLi9taWRkbGV3YXJlL3JhdGVMaW1pdCc7XG5pbXBvcnQgeyBpbml0aWFsaXplU2VjdXJpdHlIZWFkZXJzIH0gZnJvbSAnLi9taWRkbGV3YXJlL3NlY3VyaXR5SGVhZGVycyc7XG5pbXBvcnQgeyBleHByZXNzRXJyb3JIYW5kbGVyIH0gZnJvbSAnLi9taWRkbGV3YXJlL2V4cHJlc3NFcnJvckhhbmRsZXInO1xuaW1wb3J0IHsgZ2V0UmVkaXNDbGllbnQgfSBmcm9tICcuL2NvbmZpZy9yZWRpcyc7XG5pbXBvcnQgeyBpbml0aWFsaXplQ3NyZk1pZGRsZXdhcmUgfSBmcm9tICcuL21pZGRsZXdhcmUvY3NyZic7XG5pbXBvcnQgeyBjcmVhdGVNZW1vcnlNb25pdG9yIH0gZnJvbSAnLi9taWRkbGV3YXJlL21lbW9yeU1vbml0b3InO1xuaW1wb3J0IG9zIGZyb20gJ29zJztcbmltcG9ydCBwcm9jZXNzIGZyb20gJ3Byb2Nlc3MnO1xuaW1wb3J0IHsgaW5pdGlhbGl6ZVJvdXRlcyB9IGZyb20gJy4vc2V0dXBSb3V0ZXMnO1xuaW1wb3J0IHsgaW5pdGlhbGl6ZVZhbGlkYXRvck1pZGRsZXdhcmUgfSBmcm9tICcuL21pZGRsZXdhcmUvdmFsaWRhdG9yJztcbmltcG9ydCB7IGluaXRpYWxpemVTbG93ZG93bk1pZGRsZXdhcmUgfSBmcm9tICcuL21pZGRsZXdhcmUvc2xvd2Rvd24nO1xuaW1wb3J0IHsgcHJvY2Vzc0Vycm9yIH0gZnJvbSAnLi91dGlscy9wcm9jZXNzRXJyb3InO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuL3V0aWxzL3ZhbGlkYXRlRGVwZW5kZW5jaWVzJztcblxubGV0IGxvZ2dlcjogTG9nZ2VyO1xuXG5hc3luYyBmdW5jdGlvbiBzdGFydCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0dHJ5IHtcblx0XHRsb2FkRW52KCk7XG5cblx0XHRjb25zdCBzdGF0aWNSb290UGF0aCA9IGVudmlyb25tZW50VmFyaWFibGVzLnN0YXRpY1Jvb3RQYXRoO1xuXG5cdFx0bG9nZ2VyID0gc2V0dXBMb2dnZXIoKTtcblx0XHRsb2dnZXIuaW5mbygnTG9nZ2VyIHN1Y2Nlc3NmdWxseSBpbml0aWFsaXplZCcpO1xuXG5cdFx0Y29uc3QgZmVhdHVyZUZsYWdzID0ge30gYXMgRmVhdHVyZUZsYWdzO1xuXG5cdFx0Y29uc3QgbWVtb3J5TW9uaXRvciA9IGNyZWF0ZU1lbW9yeU1vbml0b3Ioe1xuXHRcdFx0bG9nZ2VyLFxuXHRcdFx0b3MsXG5cdFx0XHRwcm9jZXNzLFxuXHRcdFx0c2V0SW50ZXJ2YWxcblx0XHR9KTtcblxuXHRcdGNvbnN0IHNlY3JldHMgPSBhd2FpdCBzb3BzLmdldFNlY3JldHMoe1xuXHRcdFx0bG9nZ2VyLFxuXHRcdFx0ZXhlY1N5bmMsXG5cdFx0XHRnZXREaXJlY3RvcnlQYXRoOiAoKSA9PiBwcm9jZXNzLmN3ZCgpXG5cdFx0fSk7XG5cblx0XHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRcdFtcblx0XHRcdFx0eyBuYW1lOiAnbG9nZ2VyJywgaW5zdGFuY2U6IGxvZ2dlciB9LFxuXHRcdFx0XHR7IG5hbWU6ICdzdGF0aWNSb290UGF0aCcsIGluc3RhbmNlOiBzdGF0aWNSb290UGF0aCB9LFxuXHRcdFx0XHR7IG5hbWU6ICdmZWF0dXJlRmxhZ3MnLCBpbnN0YW5jZTogZmVhdHVyZUZsYWdzIH1cblx0XHRcdF0sXG5cdFx0XHRsb2dnZXJcblx0XHQpO1xuXG5cdFx0Ly8gdGVzdCBsb2dnZXIgbW9kdWxlIHdyaXRpbmcgZnVuY3Rpb25zIGluIGRldmVsb3BtZW50XG5cdFx0aWYgKGVudmlyb25tZW50VmFyaWFibGVzLm5vZGVFbnYgPT09ICdkZXZlbG9wbWVudCcpIHtcblx0XHRcdGxvZ2dlci5kZWJ1ZygnVGVzdGluZyBsb2dnZXIgbGV2ZWxzLi4uJyk7XG5cdFx0XHRjb25zb2xlLmxvZygnVGVzdCBsb2cnKTtcblx0XHRcdGNvbnNvbGUuaW5mbygnVGVzdCBpbmZvIGxvZycpO1xuXHRcdFx0Y29uc29sZS53YXJuKCdUZXN0IHdhcm5pbmcnKTtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1Rlc3QgZXJyb3InKTtcblx0XHRcdGNvbnNvbGUuZGVidWcoJ1Rlc3QgZGVidWcgbG9nJyk7XG5cdFx0fVxuXG5cdFx0Ly8gZGF0YWJhc2UgaW5pdGlhbGl6YXRpb25cblx0XHRsb2dnZXIuaW5mbygnSW5pdGlhbGl6aW5nIGRhdGFiYXNlJyk7XG5cdFx0Y29uc3Qgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKHtcblx0XHRcdGxvZ2dlcixcblx0XHRcdGZlYXR1cmVGbGFncyxcblx0XHRcdGdldFNlY3JldHM6ICgpID0+XG5cdFx0XHRcdHNvcHMuZ2V0U2VjcmV0cyh7XG5cdFx0XHRcdFx0bG9nZ2VyLFxuXHRcdFx0XHRcdGV4ZWNTeW5jLFxuXHRcdFx0XHRcdGdldERpcmVjdG9yeVBhdGg6ICgpID0+IHByb2Nlc3MuY3dkKClcblx0XHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdC8vIG1vZGVscyBpbml0aWFsaXphdGlvblxuXHRcdGxvZ2dlci5pbmZvKCdJbml0aWFsaXppbmcgbW9kZWxzJyk7XG5cdFx0aW5pdGlhbGl6ZU1vZGVscyhzZXF1ZWxpemUsIGxvZ2dlcik7XG5cblx0XHQvLyBwYXNzcG9ydCBpbml0aWFsaXphdGlvblxuXHRcdGxvZ2dlci5pbmZvKCdJbml0aWFsaXppbmcgcGFzc3BvcnQnKTtcblx0XHRjb25zdCBVc2VyTW9kZWwgPSBjcmVhdGVVc2VyTW9kZWwoc2VxdWVsaXplLCBsb2dnZXIpO1xuXHRcdGF3YWl0IGNvbmZpZ3VyZVBhc3Nwb3J0KHtcblx0XHRcdHBhc3Nwb3J0LFxuXHRcdFx0bG9nZ2VyLFxuXHRcdFx0Z2V0U2VjcmV0czogKCkgPT5cblx0XHRcdFx0c29wcy5nZXRTZWNyZXRzKHtcblx0XHRcdFx0XHRsb2dnZXIsXG5cdFx0XHRcdFx0ZXhlY1N5bmMsXG5cdFx0XHRcdFx0Z2V0RGlyZWN0b3J5UGF0aDogKCkgPT4gcHJvY2Vzcy5jd2QoKVxuXHRcdFx0XHR9KSxcblx0XHRcdFVzZXJNb2RlbCxcblx0XHRcdGFyZ29uMlxuXHRcdH0pO1xuXG5cdFx0Ly8gbWlkZGxld2FyZSBpbml0aWFsaXphdGlvblxuXHRcdGxvZ2dlci5pbmZvKCdJbml0aWFsaXppbmcgbWlkZGxld2FyZScpO1xuXHRcdGNvbnN0IGFwcCA9IGF3YWl0IGluaXRpYWxpemVNaWRkbGV3YXJlKHtcblx0XHRcdGV4cHJlc3MsXG5cdFx0XHRzZXNzaW9uLFxuXHRcdFx0Y29va2llUGFyc2VyLFxuXHRcdFx0Y29ycyxcblx0XHRcdGhwcCxcblx0XHRcdG1vcmdhbixcblx0XHRcdHBhc3Nwb3J0LFxuXHRcdFx0cmFuZG9tQnl0ZXMsXG5cdFx0XHRSZWRpc1N0b3JlLFxuXHRcdFx0aW5pdGlhbGl6ZUNzcmZNaWRkbGV3YXJlLFxuXHRcdFx0Z2V0UmVkaXNDbGllbnQsXG5cdFx0XHRpcEJsYWNrbGlzdE1pZGRsZXdhcmUsXG5cdFx0XHRpbml0aWFsaXplUmF0ZUxpbWl0TWlkZGxld2FyZSxcblx0XHRcdGluaXRpYWxpemVTZWN1cml0eUhlYWRlcnMsXG5cdFx0XHRjcmVhdGVNZW1vcnlNb25pdG9yOiBtZW1vcnlNb25pdG9yLnN0YXJ0TWVtb3J5TW9uaXRvcixcblx0XHRcdGxvZ2dlcixcblx0XHRcdHN0YXRpY1Jvb3RQYXRoLFxuXHRcdFx0ZmVhdHVyZUZsYWdzLFxuXHRcdFx0ZXhwcmVzc0Vycm9ySGFuZGxlcixcblx0XHRcdHByb2Nlc3NFcnJvcixcblx0XHRcdHNlY3JldHMsXG5cdFx0XHR2ZXJpZnlKd3Q6IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnand0JywgeyBzZXNzaW9uOiBmYWxzZSB9KSxcblx0XHRcdGluaXRpYWxpemVKd3RBdXRoTWlkZGxld2FyZTogKCkgPT5cblx0XHRcdFx0cGFzc3BvcnQuYXV0aGVudGljYXRlKCdqd3QnLCB7IHNlc3Npb246IGZhbHNlIH0pLFxuXHRcdFx0aW5pdGlhbGl6ZVBhc3Nwb3J0QXV0aE1pZGRsZXdhcmU6ICgpID0+XG5cdFx0XHRcdHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnbG9jYWwnKSxcblx0XHRcdGF1dGhlbnRpY2F0ZU9wdGlvbnM6IHsgc2Vzc2lvbjogZmFsc2UgfSxcblx0XHRcdGluaXRpYWxpemVWYWxpZGF0b3JNaWRkbGV3YXJlLFxuXHRcdFx0aW5pdGlhbGl6ZVNsb3dkb3duTWlkZGxld2FyZVxuXHRcdH0pO1xuXG5cdFx0Ly8gaW5pdGlhbGl6ZSByb3V0ZXNcblx0XHRsb2dnZXIuaW5mbygnSW5pdGlhbGl6aW5nIHJvdXRlcycpO1xuXHRcdGluaXRpYWxpemVSb3V0ZXMoe1xuXHRcdFx0YXBwLFxuXHRcdFx0bG9nZ2VyLFxuXHRcdFx0ZmVhdHVyZUZsYWdzLFxuXHRcdFx0c3RhdGljUm9vdFBhdGhcblx0XHR9KTtcblxuXHRcdC8vIHN5bmMgZGF0YWJhc2UgaWYgZmxhZyBpcyBlbmFibGVkXG5cdFx0Y29uc3QgZGJTeW5jRmxhZyA9IGZlYXR1cmVGbGFncz8uZGJTeW5jRmxhZyA/PyBmYWxzZTtcblx0XHRpZiAoZW52aXJvbm1lbnRWYXJpYWJsZXMubm9kZUVudiA9PT0gJ3Byb2R1Y3Rpb24nIHx8IGRiU3luY0ZsYWcpIHtcblx0XHRcdGxvZ2dlci5pbmZvKCdTeW5jaW5nIGRhdGFiYXNlIG1vZGVscycpO1xuXHRcdFx0YXdhaXQgc2VxdWVsaXplLnN5bmMoKTtcblx0XHRcdGxvZ2dlci5pbmZvKCdEYXRhYmFzZSBhbmQgdGFibGVzIGNyZWF0ZWQhJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVkaXNDbGllbnQgPSBhd2FpdCBnZXRSZWRpc0NsaWVudCgpO1xuXG5cdFx0Ly8gc2V0IHVwIEhUVFAvSFRUUFMgc2VydmVyXG5cdFx0YXdhaXQgc2V0dXBIdHRwU2VydmVyKHtcblx0XHRcdGFwcCxcblx0XHRcdHNvcHMsXG5cdFx0XHRmczogZnNQcm9taXNlcyxcblx0XHRcdGxvZ2dlcixcblx0XHRcdGNvbnN0YW50cyxcblx0XHRcdGZlYXR1cmVGbGFncyxcblx0XHRcdGdldFJlZGlzQ2xpZW50OiAoKSA9PiByZWRpc0NsaWVudCxcblx0XHRcdGdldFNlcXVlbGl6ZUluc3RhbmNlOiAoKSA9PiBnZXRTZXF1ZWxpemVJbnN0YW5jZSh7IGxvZ2dlciB9KVxuXHRcdH0pO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGlmICghbG9nZ2VyKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFxuXHRcdFx0XHRgQ3JpdGljYWwgZXJyb3IgYmVmb3JlIGxvZ2dlciBzZXR1cDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0cHJvY2Vzc0Vycm9yKGVycm9yLCBjb25zb2xlKTtcblx0XHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgQ3JpdGljYWwgZXJyb3IgYmVmb3JlIGxvZ2dlciBzZXR1cDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0cHJvY2Vzc0Vycm9yKGVycm9yLCBsb2dnZXIpO1xuXHRcdFx0cHJvY2Vzcy5leGl0KDEpO1xuXHRcdH1cblx0fVxufVxuXG5hd2FpdCBzdGFydCgpO1xuIl19