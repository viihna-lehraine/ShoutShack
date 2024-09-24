import { Options, Sequelize } from 'sequelize';
import { InitializeDatabaseInterface } from '../index/interfaces';
import { AppError } from '../errors/errorClasses';
import {
	envVariables,
	ProcessErrorStaticParameters
} from '../index/parameters';
import { configService } from './configService';
import { AppLoggerInterface } from '../index/interfaces';
import { envSecretsStore } from '../environment/envSecrets';
import { errorHandler } from './errorHandler';
import { blankRequest } from '../utils/constants';

export class DatabaseService {
	private static instance: DatabaseService;
	private sequelizeInstance: Sequelize | null = null;
	private pool: Record<string, unknown> = {};
	private attempt = 0;
	private configService = configService;
	private logger = configService.getAppLogger();
	private errorLogger = configService.getErrorLogger();

	constructor() {
		this.logger = configService.getAppLogger();
		const dbConfig: Options = {
			host: configService.getEnvVariables().dbHost,
			username: configService.getEnvVariables().dbUser,
			password: envSecretsStore.retrieveSecret(
				'dbPassword',
				this.logger
			)!,
			database: configService.getEnvVariables().dbName,
			dialect: configService.getEnvVariables().dbDialect,
			pool: {
				max: 10,
				min: 0,
				acquire: 30000,
				idle: 10000
			},
			logging: msg => this.logger.debug(msg)
		};

		this.sequelizeInstance = new Sequelize(dbConfig);

		this.connect();
	}

	private async connect(): Promise<void> {
		try {
			if (!this.sequelizeInstance) {
				const sequelizeInitError =
					new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Sequelize instance not initialized`
					);
				errorHandler.handleError({
					error: sequelizeInitError,
					details: { reason: 'Sequelize instance INIT failed' }
				});
				throw sequelizeInitError;
			}
			await this.sequelizeInstance.authenticate();
			this.logger.logInfo(
				'Database connection has been established successfully.'
			);
		} catch (dbError: unknown) {
			const dbConnectionError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Failed to authenticate database connection: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
					{ originalError: dbError }
				);
			errorHandler.handleError({
				error: dbError,
				details: {
					reason: 'Failed to authenticate database connection'
				}
			});
			throw dbConnectionError;
		}
	}

	public async initializeDatabase(): Promise<Sequelize> {
		this.logger.info('Initializing database connection...');
		return this.tryInitDB();
	}

	private async tryInitDB(): Promise<Sequelize> {
		try {
			if (!this.sequelizeInstance) {
				this.logger.info(
					`Sequelize logging set to ${this.featureFlags.sequelizeLogging}`
				);

				const sequelizeOptions: Options = {
					host: this.configService.getEnvVariables.dbHost,
					dialect: this.params.envVariables.dbDialect,
					logging: this.params.featureFlags.sequelizeLogging
						? (msg: string) => this.params.appLogger.info(msg)
						: false
				};

				const dbPassword = this.params.envSecretsStore.retrieveSecret(
					'dbPassword',
					this.params.appLogger
				);

				this.sequelizeInstance = new Sequelize(
					this.params.envVariables.dbName,
					this.params.envVariables.dbUser,
					dbPassword!,
					sequelizeOptions
				);

				await this.sequelizeInstance.authenticate();
				this.params.appLogger.info(
					'Connection has been established successfully.'
				);

				this.params.envSecretsStore.reEncryptSecret(dbPassword!);
				this.params.appLogger.debug('Database password re-encrypted.');
			} else {
				this.params.appLogger.info(
					'Database connection already initialized.'
				);
				return this.sequelizeInstance;
			}

			return this.sequelizeInstance;
		} catch (dbError: unknown) {
			this.attempt += 1;
			const errorMessage =
				dbError instanceof Error ? dbError.message : 'Unknown error';

			if (this.attempt < this.params.dbInitMaxRetries) {
				const recoverableError: AppError =
					new this.params.errorClasses.DatabaseErrorRecoverable(
						`Database connection attempt ${this.attempt} failed\nRetrying...`,
						{
							dbHost: envVariables.dbHost,
							dbDialect: envVariables.dbDialect,
							originalError: dbError,
							statusCode: 500,
							severity: this.params.ErrorSeverity.RECOVERABLE,
							exposeToClient: false
						}
					);
				this.params.errorLogger.logError(
					recoverableError,
					this.params.errorLoggerDetails(
						this.params.getCallerInfo,
						'DATABASE_INIT',
						this.params.blankRequest
					),
					this.params.appLogger,
					this.params.ErrorSeverity.RECOVERABLE
				);
				const processErrorParams = {
					...ProcessErrorStaticParameters,
					error: recoverableError,
					req: this.params.blankRequest,
					details: { reason: 'Failed to initialize database' }
				};
				this.params.processError(processErrorParams);
				this.params.appLogger.warn(
					`Retrying database connection in ${this.params.dbInitRetryAfter / 1000} seconds...`
				);
				await new Promise(resolve =>
					setTimeout(resolve, this.params.dbInitRetryAfter)
				);
				return this.tryInitDB();
			} else {
				const fatalError =
					new this.params.errorClasses.DatabaseErrorFatal(
						`Failed to authenticate database connection after ${this.params.dbInitMaxRetries} attempts: ${errorMessage}`,
						{
							dbHost: envVariables.dbHost,
							dbDialect: envVariables.dbDialect,
							originalError: dbError,
							statusCode: 500,
							severity: this.params.ErrorSeverity.FATAL,
							exposeToClient: false
						}
					);

				this.params.errorLogger.logError(
					fatalError as AppError,
					this.params.errorLoggerDetails(
						this.params.getCallerInfo,
						'DATABASE_INIT',
						this.params.blankRequest
					),
					this.params.appLogger,
					this.params.ErrorSeverity.FATAL
				);
				throw fatalError;
			}
		}
	}

	// Return the existing Sequelize instance (singleton)
	public getInstance(): Sequelize | null {
		return this.sequelizeInstance;
	}
}
