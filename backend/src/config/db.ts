import { Options, Sequelize } from 'sequelize';
import { FeatureFlagTypes } from '../environment/envVars';
import { envSecrets, envSecretsStore, featureFlagsStore } from '../environment/envConfig';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export interface DBSecrets {
	DB_NAME: string;
	DB_USER: string;
	DB_PASSWORD: string;
	DB_HOST: string;
	DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
}

export interface DBDependencies {
	logger: Logger;
	featureFlagsStore: FeatureFlagTypes;
	envSecrets;
}

let sequelize: Sequelize | null = null;

export async function initializeDatabase({
	logger,
	featureFlagsStore,
	getSecrets
}: DBDependencies): Promise<Sequelize> {
	const maxRetries = 5;
	const retryAfter = 2000; // in ms
	let attempt = 0;

	async function tryInitialize(): Promise<Sequelize> {
		logger.info('Initializing database connection...');

		try {
			validateDependencies(
				[
					{ name: 'logger', instance: logger },
					{ name: 'featureFlags', instance: featureFlags },
					{ name: 'getSecrets', instance: getSecrets }
				],
				logger || console
			);

			const secrets: DBSecrets = await getSecrets();

			if (!secrets.DB_NAME || !secrets.DB_USER || !secrets.DB_PASSWORD || !secrets.DB_HOST || !secrets.DB_DIALECT) {
				throw new errorClasses.ConfigurationError(
					'Database credentials are missing. Check DB_NAME, DB_USER, and DB_PASSWORD in your configuration.',
					{
						DB_NAME: secrets.DB_NAME,
						DB_USER: secrets.DB_USER,
						exposeToClient: false
					}
				);
			}

			if (!sequelize) {
				logger.info(
					`Sequelize logging set to ${featureFlags.sequelizeLoggingFlag}`
				);

				const sequelizeOptions: Options = {
					host: secrets.DB_HOST,
					dialect: secrets.DB_DIALECT,
					logging: featureFlags.sequelizeLoggingFlag ? (msg: string) => logger.info(msg) : false,
				};

				sequelize = new Sequelize(
					secrets.DB_NAME,
					secrets.DB_USER,
					secrets.DB_PASSWORD,
					sequelizeOptions
				);

				await sequelize.authenticate();
				logger.info('Connection has been established successfully.');
			} else {
				logger.info('Database connection already initialized.');
				return sequelize;
			}

			return sequelize;
		} catch (dbError: unknown) {
			attempt += 1;
			const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';

			if (attempt < maxRetries) {
				const recoverableError = new errorClasses.DatabaseErrorRecoverable(
					`Attempt ${attempt} failed: Failed to authenticate database connection. Retrying...`,
					{
						DB_HOST: 'Hidden for security',
						DB_DIALECT: 'Hidden for security',
						exposeToClient: false
					}
				);
				ErrorLogger.logError(recoverableError, logger);
				processError(recoverableError, logger || console);

				logger.warn(`Retrying database connection in ${retryAfter / 1000} seconds...`);
				await new Promise(resolve => setTimeout(resolve, retryAfter));
				return tryInitialize();
			} else {
				const fatalError = new errorClasses.DatabaseErrorFatal(
					`Failed to authenticate database connection after ${maxRetries} attempts: ${errorMessage}`,
					{
						DB_HOST: 'Hidden for security',
						DB_DIALECT: 'Hidden for security',
						exposeToClient: false
					}
				);

				ErrorLogger.logError(fatalError, logger);
				throw fatalError;
			}
		}
	}

	return tryInitialize();
}
