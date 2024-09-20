import { Options, Sequelize } from 'sequelize';
import { ConfigService } from './configService';
import { FeatureFlagTypes } from '../environment/envVars';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { ensureSecrets } from '../utils/ensureSecrets';

export interface DBSecrets {
	dbName: string;
	dbUser: string;
	dbPassword: string;
	dbHost: string;
	dbDialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
}

let sequelize: Sequelize | null = null;

export async function initializeDatabase(): Promise<Sequelize> {
	const appLogger = ConfigService.getInstance().getLogger();
	const featureFlags = ConfigService.getInstance().getFeatureFlags();
	const secrets = ensureSecrets({ subSecrets: ['dbName', 'dbUser', 'dbPassword', 'dbHost', 'dbDialect'] });
	const maxRetries = 5;
	const retryAfter = 2000; // in ms
	let attempt = 0;

	async function tryInitialize(): Promise<Sequelize> {
		appLogger.info('Initializing database connection...');

		try {
			if (!sequelize) {
				appLogger.info(
					`Sequelize logging set to ${featureFlags.sequelizeLogging}`
				);

				const sequelizeOptions: Options = {
					host: secrets.dbHost,
					dialect: secrets.dbDialect,
					logging: featureFlags.sequelizeLogging ? (msg: string) => appLogger.info(msg) : false,
				};

				sequelize = new Sequelize(
					secrets.dbName,
					secrets.dbUser,
					secrets.dbPassword,
					sequelizeOptions
				);

				await sequelize.authenticate();
				appLogger.info('Connection has been established successfully.');
			} else {
				appLogger.info('Database connection already initialized.');
				return sequelize;
			}

			return sequelize;
		} catch (dbError: unknown) {
			attempt += 1;
			const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';

			if (attempt < maxRetries) {
				const recoverableError = new errorClasses.DatabaseErrorRecoverable(
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
				ErrorLogger.logError(recoverableError);
				processError(recoverableError);

				appLogger.warn(`Retrying database connection in ${retryAfter / 1000} seconds...`);
				await new Promise(resolve => setTimeout(resolve, retryAfter));
				return tryInitialize();
			} else {
				const fatalError = new errorClasses.DatabaseErrorFatal(
					`Failed to authenticate database connection after ${maxRetries} attempts: ${errorMessage}`,
					{
						dbHost: 'Hidden for security',
						dbDialect: 'Hidden for security',
						originalError: dbError,
						statusCode: 500,
						severity: ErrorSeverity.FATAL,
						exposeToClient: false
					}
				);

				ErrorLogger.logError(fatalError);
				throw fatalError;
			}
		}
	}

	return tryInitialize();
}
