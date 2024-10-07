import process from 'process';
import { login } from './admin';
import { ServiceFactory } from './index/factory/ServiceFactory';
import { VaultService } from './services/Vault';
import { AppLoggerServiceInterface } from './index/interfaces/main';

let logger: AppLoggerServiceInterface;

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

				logger.setAdminId(adminId);

				const errorHandler =
					await ServiceFactory.getErrorHandlerService();

				logger.setErrorHandler(errorHandler);

				const envConfig = await ServiceFactory.getEnvConfigService();

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
				return { envConfig, errorLogger, errorHandler, logger, vault };
			})
			.then(async () => {
				const middlewareStatusService =
					await ServiceFactory.getMiddlewareStatusService();
				return middlewareStatusService;
			})
			.then(async () => {
				const rootMiddleware =
					await ServiceFactory.getRootMiddlewareService();
				rootMiddleware.initialize();
				return rootMiddleware;
			})
			.then(async () => {
				const databaseController =
					await ServiceFactory.getDatabaseController();
				databaseController.initialize();
				return databaseController;
			})
			.then(async () => {
				const cacheService = await ServiceFactory.getCacheService();
				return cacheService;
			})
			.then(async () => {
				const gatekeeper = await ServiceFactory.getGatekeeperService();
				return gatekeeper.initialize();
			})
			.then(async () => {
				const accessControl =
					await ServiceFactory.getAccessControlMiddlewareService();
				return accessControl;
			})
			.then(async () => {
				const baseRouter = await ServiceFactory.getBaseRouter();
				return baseRouter;
			})
			.then(async () => {
				const userController = await ServiceFactory.getUserController();
				return userController;
			})
			.then(async () => {
				const authController = await ServiceFactory.getAuthController();
				return authController;
			})
			.then(async () => {
				const [
					backupCodeService,
					emailMFAService,
					fido2Service,
					jwtService,
					passwordService,
					totpService,
					yubicoOTPService
				] = await Promise.all([
					ServiceFactory.getBackupCodeService(),
					ServiceFactory.getEmailMFAService(),
					ServiceFactory.getFIDO2Service(),
					ServiceFactory.getJWTService(),
					ServiceFactory.getPasswordService(),
					ServiceFactory.getTOTPService(),
					ServiceFactory.getYubicoOTPService()
				]);
				return {
					backupCodeService,
					emailMFAService,
					fido2Service,
					jwtService,
					passwordService,
					totpService,
					yubicoOTPService
				};
			})
			.then(async () => {
				await ServiceFactory.getPassportService();
			})
			.then(async () => {
				const [
					csrfMiddleware,
					helmetMiddleware,
					jwtAuthMiddleware,
					passportAuthMiddleware
				] = await Promise.all([
					ServiceFactory.getCSRFMiddlewareService(),
					ServiceFactory.getHelmetMiddlewareService(),
					ServiceFactory.getJWTAuthMiddlewareService(),
					ServiceFactory.getPassportAuthMiddlewareService()
				]);
				return {
					csrfMiddleware,
					helmetMiddleware,
					jwtAuthMiddleware,
					passportAuthMiddleware
				};
			})
			.then(async () => {
				const [mailerService, multerUploadService] = await Promise.all([
					ServiceFactory.getMailerService(),
					ServiceFactory.getMulterUploadService()
				]);
				return {
					mailerService,
					multerUploadService
				};
			})
			.then(async () => {
				const httpsServer = await ServiceFactory.getHTTPSServer();
				return httpsServer.startServer();
			})
			.then(async () => {
				const resourceManager =
					await ServiceFactory.getResourceManager();
				return resourceManager;
			})
			.then(async () => {
				const healthCheckService =
					await ServiceFactory.getHealthCheckService();
				return healthCheckService;
			})
			.then(async () => {
				logger.info('All services initialized successfully.');
			})
			.catch(error => {
				const fallbackLogger = logger;
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
		const fallbackLogger = await ServiceFactory.getLoggerService();
		if (!fallbackLogger) {
			console.error(
				`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
			);
			process.exit(1);
		} else {
			fallbackLogger.logError(
				`Critical error occurred during startup\n${error instanceof Error ? error.message : String(error)}`
			);
			process.exit(1);
		}
	}
}

await start();
