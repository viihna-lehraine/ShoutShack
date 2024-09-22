import { Options, Sequelize } from 'sequelize';
import { InitializeDatabase } from '../interfaces/databaseInterfaces';
import { AppError } from '../errors/errorClasses';
import { configService } from '../services/configService';

const dbInitMaxRetries = 5;
const dbInitRetryAfter = 2000; // in ms
let sequelize: Sequelize | null = null;

export async function initializeDatabase({ appLogger, blankRequest, dbInitMaxRetries, dbInitRetryAfter, envSecretsStore, envVariables, errorClasses, errorLoggerDetails, ErrorSeverity, errorLogger, featureFlags, getCallerInfo, processError }: InitializeDatabase): Promise<Sequelize> {
	let attempt = 0;

	async function tryInitDB(): Promise<Sequelize> {
		appLogger.info('Initializing database connection...');

		try {
			if (!sequelize) {
				appLogger.info(
					`Sequelize logging set to ${featureFlags.sequelizeLogging}`
				);

				const sequelizeOptions: Options = {
					host: envVariables.dbHost,
					dialect: envVariables.dbDialect,
					logging: featureFlags.sequelizeLogging ? (msg: string) => appLogger.info(msg) : false,
				};

				const dbPassword = envSecretsStore.retrieveSecret('dbPassword', appLogger);

				sequelize = new Sequelize(
					envVariables.dbName,
					envVariables.dbUser,
					dbPassword!,
					sequelizeOptions
				);

				await sequelize.authenticate();
				appLogger.info('Connection has been established successfully.');
				envSecretsStore.reEncryptSecret(dbPassword!);
			} else {
				appLogger.info('Database connection already initialized.');
				return sequelize;
			}

			return sequelize;
		} catch (dbError: unknown) {
			attempt += 1;
			const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';

			if (attempt < dbInitMaxRetries) {
				const recoverableError: AppError = new errorClasses.DatabaseErrorRecoverable(
					`Database error connection attempt ${attempt} failed\nRetrying...`,
					{
						dbHost: 'REDACTED',
						dbDialect: 'REDACTED',
						originalError: dbError,
						statusCode: 500,
						severity: ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
				errorLogger.logError(
					recoverableError,
					errorLoggerDetails(getCallerInfo, blankRequest, 'DATABASE_INIT'),
					appLogger,
					ErrorSeverity.RECOVERABLE
				);
				processError(recoverableError);

				appLogger.warn(`Retrying database connection in ${dbInitRetryAfter / 1000} seconds...`);
				await new Promise(resolve => setTimeout(resolve, dbInitRetryAfter));
				return tryInitDB();
			} else {
				const fatalError = new errorClasses.DatabaseErrorFatal(
					`Failed to authenticate database connection after ${dbInitMaxRetries} attempts: ${errorMessage}`,
					{
						dbHost: 'Hidden for security',
						dbDialect: 'Hidden for security',
						originalError: dbError,
						statusCode: 500,
						severity: ErrorSeverity.FATAL,
						exposeToClient: false
					}
				);

				errorLogger.logError(
					fatalError as AppError,
					errorLoggerDetails(getCallerInfo, blankRequest, 'DATABASE_INIT'),
					appLogger,
					ErrorSeverity.FATAL
				);
				throw fatalError;
			}
		}
	}

	return tryInitDB();
}

export { sequelize };
