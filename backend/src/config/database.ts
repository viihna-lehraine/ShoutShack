import { Options, Sequelize } from 'sequelize';
import { InitializeDatabaseInterface } from '../index/databaseInterfaces';
import { AppError } from '../errors/errorClasses';
import { ProcessErrorStaticParameters } from '../parameters/errorParameters';
import { envVariables } from '../parameters/environmentParameters';

let sequelizeInstance: Sequelize;

export async function initializeDatabase(params: InitializeDatabaseInterface): Promise<Sequelize> {
	let attempt = 0;

	async function tryInitDB(): Promise<Sequelize> {
		params.appLogger.info('Initializing database connection...');

		try {
			if (!sequelizeInstance) {
				params.appLogger.info(`Sequelize logging set to ${params.featureFlags.sequelizeLogging}`);

				const sequelizeOptions: Options = {
					host: params.envVariables.dbHost,
					dialect: params.envVariables.dbDialect,
					logging: params.featureFlags.sequelizeLogging ? (msg: string) => params.appLogger.info(msg) : false,
				};

				const dbPassword = params.envSecretsStore.retrieveSecret('dbPassword', params.appLogger);

				sequelizeInstance = new Sequelize(
					params.envVariables.dbName,
					params.envVariables.dbUser,
					dbPassword!,
					sequelizeOptions
				);

				await sequelizeInstance.authenticate();
				params.appLogger.info('Connection has been established successfully.');

				params.envSecretsStore.reEncryptSecret(dbPassword!);
				params.appLogger.debug('Database password re-encrypted.');
			} else {
				params.appLogger.info('Database connection already initialized.');
				return sequelizeInstance;
			}

			return sequelizeInstance;
		} catch (dbError: unknown) {
			attempt += 1;
			const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';

			if (attempt < params.dbInitMaxRetries) {
				const recoverableError: AppError = new params.errorClasses.DatabaseErrorRecoverable(
					`Database error connection attempt ${attempt} failed\nRetrying...`,
					{
						dbHost: envVariables.dbHost,
						dbDialect: envVariables.dbDialect,
						originalError: dbError,
						statusCode: 500,
						severity: params.ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
				params.errorLogger.logError(
					recoverableError,
					params.errorLoggerDetails(params.getCallerInfo, 'DATABASE_INIT', params.blankRequest),
					params.appLogger,
					params.ErrorSeverity.RECOVERABLE
				);
				const processErrorParams = {
					...ProcessErrorStaticParameters,
					error: recoverableError,
					req: params.blankRequest,
					details: { reason: 'Failed to initialize database' }
				};
				params.processError(processErrorParams);
				params.appLogger.warn(`Retrying database connection in ${params.dbInitRetryAfter / 1000} seconds...`);
				await new Promise(resolve => setTimeout(resolve, params.dbInitRetryAfter));
				return tryInitDB();
			} else {
				const fatalError = new params.errorClasses.DatabaseErrorFatal(
					`Failed to authenticate database connection after ${params.dbInitMaxRetries} attempts: ${errorMessage}`,
					{
						dbHost: envVariables.dbHost,
						dbDialect: envVariables.dbDialect,
						originalError: dbError,
						statusCode: 500,
						severity: params.ErrorSeverity.FATAL,
						exposeToClient: false
					}
				);

				params.errorLogger.logError(
					fatalError as AppError,
					params.errorLoggerDetails(params.getCallerInfo, 'DATABASE_INIT', params.blankRequest),
					params.appLogger,
					params.ErrorSeverity.FATAL
				);
				throw fatalError;
			}
		}
	}

	return tryInitDB();
}

export { sequelizeInstance };
