import { Options, Sequelize } from 'sequelize';
import { FeatureFlags } from './environmentConfig';
import { AppError, errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { Logger } from '../utils/logger';
import { processError } from '../utils/processError';
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
	featureFlags: FeatureFlags,
	getSecrets: () => Promise<DBSecrets>;
}

let sequelize: Sequelize | null = null;

export async function initializeDatabase({
	logger,
	featureFlags,
	getSecrets
}: DBDependencies): Promise<Sequelize> {
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
				{ DB_NAME: secrets.DB_NAME, DB_USER: secrets.DB_USER }
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
			}

			try {
				sequelize = new Sequelize(
					secrets.DB_NAME,
					secrets.DB_USER,
					secrets.DB_PASSWORD,
					sequelizeOptions
				);

				await sequelize.authenticate();
				logger.info('Connection has been established successfully.');
			} catch (dbError: unknown) {
				const errorMessage = (dbError instanceof Error) ? dbError.message : 'Unknown error';
				throw new errorClasses.DatabaseErrorFatal(
					`Failed to authenticate database connection: ${errorMessage}`,
					{ DB_HOST: secrets.DB_HOST, DB_DIALECT: secrets.DB_DIALECT }
				)
			}
		}

		return sequelize;
	} catch (error) {
		processError(error as Error, logger || console);
		if (error instanceof AppError) {
			throw error;
		} else {
			throw new errorClasses.DependencyError(
				'Database initialization failed due to a dependency issue.',
				{ originalError: error }
			);
		}
	}
}

export function getSequelizeInstance({
	logger
}: Pick<DBDependencies, 'logger'>): Sequelize {
    logger.info('getSequelizeInstance() executing');

    if (!sequelize) {
		logger.error(`Sequelize instance is not initialized. Call initializeDatabase() before attempting to retrieve the Sequelize instance.`);
		const error = new AppError(
			'Internal server error',
			500,
			ErrorSeverity.FATAL,
			'SEQUELIZE_NOT_INITIALIZED'
		);

		processError(error, logger || console);
		throw error;
	}

    return sequelize;
}
