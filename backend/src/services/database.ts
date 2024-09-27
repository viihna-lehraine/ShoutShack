import { Options, Sequelize, Dialect } from 'sequelize';
import { AppError } from '../errors/errorClasses';
import { errorHandler } from './errorHandler';
import {
	AppLoggerServiceInterface,
	DatabaseServiceInterface,
	EnvVariableTypes,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from '../index/interfaces';
import {
	ConfigServiceInterface,
	SecretsStoreInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { Logger } from 'winston';

export class DatabaseService implements DatabaseServiceInterface {
	private static instance: DatabaseService;
	private sequelizeInstance: Sequelize | null = null;
	private attempt = 0;
	private configService: ConfigServiceInterface;
	private secrets: SecretsStoreInterface;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;

	private constructor() {
		this.configService = ServiceFactory.getConfigService();
		this.secrets = ServiceFactory.getSecretsStore();
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();

		const host = this.getValidatedEnvVariable('dbHost');
		const username = this.getValidatedEnvVariable('dbUser');
		const database = this.getValidatedEnvVariable('dbName');
		const dialect = this.getValidatedEnvVariable('dbDialect', true);
		const password = this.getValidatedSecret('dbPassword');

		if (!host || !database || !username || !dialect) {
			throw new Error('Required database configuration is missing.');
		}

		const dbConfig: Options = {
			host,
			username,
			password,
			database,
			dialect: dialect as Dialect,
			pool: {
				max: 10,
				min: 0,
				acquire: 30000,
				idle: 10000
			},
			logging: (msg: string): void => {
				this.logger.debug(msg);
			},
			quoteIdentifiers: false
		};

		this.sequelizeInstance = new Sequelize(dbConfig);
		this.connect();
	}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}
		return DatabaseService.instance;
	}

	public getSequelizeInstance(): Sequelize {
		if (!this.sequelizeInstance) {
			throw new Error('Sequelize instance is not initialized');
		}
		return this.sequelizeInstance;
	}

	private getValidatedEnvVariable<K extends keyof EnvVariableTypes>(
		key: K,
		isOptional = false
	): EnvVariableTypes[K] | undefined {
		const value = this.configService.getEnvVariable(key);
		if (!isOptional && typeof value !== 'string') {
			throw new Error(
				`Environment variable ${String(key)} must be a string`
			);
		}
		return value as EnvVariableTypes[K] | undefined;
	}

	private getValidatedSecret(key: string): string {
		const secret = this.secrets.retrieveSecrets(key);
		if (typeof secret !== 'string') {
			throw new Error(`Secret ${key} must be a string`);
		}
		return secret;
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
		} finally {
			this.logger.debug('Database connection initialized');
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
					`Sequelize logging set to ${this.configService.getFeatureFlags().sequelizeLogging}`
				);

				const host = this.getValidatedEnvVariable('dbHost');
				const dialect = this.getValidatedEnvVariable('dbDialect', true);
				const dbPassword = this.getValidatedSecret('dbPassword');

				if (!host || !dialect) {
					throw new Error('Database host or dialect is missing.');
				}

				const sequelizeOptions: Options = {
					host,
					dialect: dialect as Dialect,
					logging: this.configService.getFeatureFlags()
						.sequelizeLogging
						? (msg: string): Logger => this.logger.info(msg)
						: false
				};

				this.sequelizeInstance = new Sequelize(
					this.getValidatedEnvVariable('dbName') as string,
					this.getValidatedEnvVariable('dbUser') as string,
					dbPassword,
					sequelizeOptions
				);

				await this.sequelizeInstance.authenticate();
				this.logger.info(
					'Connection has been established successfully.'
				);
			} else {
				this.logger.info('Database connection already initialized.');
			}

			return this.sequelizeInstance;
		} catch (dbError: unknown) {
			this.attempt += 1;
			const errorMessage =
				dbError instanceof Error ? dbError.message : 'Unknown error';

			if (
				this.attempt <
				(this.configService.getEnvVariable(
					'dbInitMaxRetries'
				) as number)
			) {
				const recoverableError: AppError =
					new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Database connection attempt ${this.attempt} failed\nRetrying...`,
						{ originalError: dbError }
					);
				this.errorLogger.logError(recoverableError.message);
				this.errorHandler.handleError({ error: recoverableError });
				this.logger.warn(
					`Retrying database connection in ${this.configService.getEnvVariable('dbInitRetryAfter')} seconds...`
				);
				await new Promise(resolve =>
					setTimeout(
						resolve,
						this.configService.getEnvVariable(
							'dbInitRetryAfter'
						) as number
					)
				);
				return this.tryInitDB();
			} else {
				const fatalError =
					new this.errorHandler.ErrorClasses.DatabaseErrorFatal(
						`Failed to authenticate database connection after ${this.configService.getEnvVariable('dbInitMaxRetries')} attempts: ${errorMessage}`,
						{ originalError: dbError }
					);
				this.configService
					.getErrorLogger()
					.logError(fatalError.message);
				throw fatalError;
			}
		} finally {
			this.secrets.reEncryptSecret('DB_PASSWORD');
			this.logger.debug('Database password re-encrypted.');
		}
	}
}
