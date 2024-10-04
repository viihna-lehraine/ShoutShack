import process from 'process';
import { login } from './admin';
import { ServiceFactory } from './index/factory';
import { VaultService } from './services/Vault';
import { Application } from 'express';

let app: Application;

async function start(): Promise<void> {
	try {
		return login()
			.then(async ({ encryptionKey, gpgPassphrase, adminId }) => {
				if (!encryptionKey || !gpgPassphrase || !adminId) {
					throw new Error(
						'Keys or Admin ID not found. Shutting down...'
					);
				}

				const logger = await ServiceFactory.getLoggerService();
				const errorLogger =
					await ServiceFactory.getErrorLoggerService();
				const errorHandler =
					await ServiceFactory.getErrorHandlerService();
				logger.setErrorHandler(errorHandler);
				const envConfig = ServiceFactory.getEnvConfigService();
				const vault = await VaultService.initialize(
					encryptionKey,
					gpgPassphrase
				);

				setInterval(
					() => vault.clearExpiredSecretsFromMemory(),
					envConfig.getEnvVariable('clearExpiredSecretsInterval')
				);
				setInterval(
					() => vault.batchClearSecrets(),
					envConfig.getEnvVariable('batchReEncryptSecretsInterval')
				);

				logger.info(
					'Secrets store initialized. READY TO ROCK AND ROLL!!!'
				);
				return { vault, logger };
			})
			.then(() => {
				const rootMiddleware =
					ServiceFactory.getRootMiddlewareService();
				rootMiddleware.initialize();
				return rootMiddleware;
			})
			.then(() => {
				const databaseController =
					ServiceFactory.getDatabaseController();
				const redisService = ServiceFactory.getRedisService();
				return Promise.all([
					databaseController.initialize(),
					redisService.initialize()
				]);
			})
			.then(() => {
				const cacheService = ServiceFactory.getCacheService();
				return cacheService.initialize();
			})
			.then(() => {
				const gatekeeper = ServiceFactory.getGatekeeperService();
				return gatekeeper.initialize();
			})
			.then(() => {
				const accessControl = ServiceFactory.getAccessControlService();
				return accessControl.initialize();
			})
			.then(() => {
				const healthCheckService =
					ServiceFactory.getHealthCheckService();
				return healthCheckService.initialize();
			})
			.then(() => {
				const resourceManager = ServiceFactory.getResourceManager();
				return resourceManager.initialize();
			})
			.then(() => {
				const baseRouter = ServiceFactory.getBaseRouterService();
				return baseRouter.initialize();
			})
			.then(() => {
				const userController = ServiceFactory.getUserController();
				return userController.initialize();
			})
			.then(() => {
				const authController = ServiceFactory.getAuthController();
				return authController.initialize();
			})
			.then(() => {
				const authServices = [
					ServiceFactory.getBackupCodeService(),
					ServiceFactory.getEmailMFAService(),
					ServiceFactory.getFIDO2Service(),
					ServiceFactory.getJWTService(),
					ServiceFactory.getPassportService(),
					ServiceFactory.getPasswordService(),
					ServiceFactory.getTOTPService(),
					ServiceFactory.getYubicoOTPService()
				];
				return Promise.all(
					authServices.map(service => service.initialize())
				);
			})
			.then(() => {
				const csrfMiddleware = ServiceFactory.getCSRFService();
				const helmetMiddleware = ServiceFactory.getHelmetMiddleware();
				const jwtAuthMiddleware = ServiceFactory.getJWTAuthMiddleware();
				const passportAuthMiddleware =
					ServiceFactory.getPassportAuthMiddleware();
				return Promise.all([
					csrfMiddleware.initialize(),
					helmetMiddleware.initialize(),
					jwtAuthMiddleware.initialize(),
					passportAuthMiddleware.initialize()
				]);
			})
			.then(() => {
				const middlewareStatusService =
					ServiceFactory.getMiddlewareStatusService();
				return middlewareStatusService.initialize();
			})
			.then(() => {
				const mailer = ServiceFactory.getMailerService();
				const multerService = ServiceFactory.getMulterUploadService();
				return Promise.all([
					mailer.initialize(),
					multerService.initialize()
				]);
			})
			.then(() => {
				const httpsServer = ServiceFactory.getHTTPSServer(app);
				return httpsServer.initialize();
			})
			.then(() => {
				const logger = ServiceFactory.getLoggerService();
				logger.info('All services initialized successfully.');
			})
			.catch(error => {
				const fallbackLogger = ServiceFactory.getLoggerService();
				if (!fallbackLogger) {
					console.error(
						`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
					);
					process.exit(1);
				} else {
					fallbackLogger.error(
						`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
					);
					process.exit(1);
				}
			});
	} catch (error) {
		const fallbackLogger = ServiceFactory.getLoggerService();
		if (!fallbackLogger) {
			console.error(
				`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
			);
			process.exit(1);
		} else {
			fallbackLogger.error(
				`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
			);
			process.exit(1);
		}
	}
}

await start();
