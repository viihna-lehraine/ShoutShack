import { Options, QueryTypes, Sequelize, Dialect } from 'sequelize';
import { AppError } from '../errors/errorClasses';
import {
	AppLoggerServiceInterface,
	DatabaseServiceInterface,
	EnvVariableTypes,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	RedisServiceInterface
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
	private redisService: RedisServiceInterface;

	private constructor() {
		this.configService = ServiceFactory.getConfigService();
		this.secrets = ServiceFactory.getSecretsStore();
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
		this.redisService = ServiceFactory.getRedisService();

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
				throw new AppError(
					'Sequelize instance is not initialized',
					500
				);
			}
			await this.sequelizeInstance.authenticate();
			this.logger.info('Connected to the database');
		} catch (error: unknown) {
			this.errorHandler.handleError({
				error,
				details: { reason: 'Database connection failed' }
			});
			throw new AppError(
				`Failed to authenticate database connection: ${
					(error as Error).message
				}`,
				500
			);
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

	public async getCachedData<T>(key: string): Promise<T | null> {
		this.logger.info(`Fetching data from cache with key: ${key}`);
		return await this.redisService.get<T>(key);
	}

	public async cacheData<T>(
		key: string,
		data: T,
		expiration?: number
	): Promise<void> {
		this.logger.info(`Caching data with key: ${key}`);
		await this.redisService.set<T>(key, data, expiration);
	}

	public async clearCache(key: string): Promise<void> {
		this.logger.info(`Clearing cache for key: ${key}`);
		await this.redisService.del(key);
	}

	public async queryWithCache<T extends object>(
		query: string,
		cacheKey: string,
		expiration?: number
	): Promise<T | null> {
		const cachedData = await this.getCachedData<T>(cacheKey);
		if (cachedData) {
			this.logger.info(`Cache hit for key: ${cacheKey}`);
			return cachedData;
		}

		this.logger.info(`Cache miss for key: ${cacheKey}, querying database`);

		const result = await this.sequelizeInstance?.query<T>(query, {
			type: QueryTypes.SELECT
		});

		if (result) {
			await this.cacheData(cacheKey, result, expiration);
		}

		return result ? (result as T) : null;
	}

	public async clearIdleConnections(): Promise<void> {
		try {
			if (this.sequelizeInstance) {
				this.logger.info(
					'Checking for idle database connections to close'
				);

				await this.sequelizeInstance.close();
				this.logger.info('All database connections have been closed');
			} else {
				this.logger.warn(
					'No Sequelize instance available to close connections'
				);
			}
		} catch (error) {
			this.errorLogger.logError(
				`Error closing database connections: ${error instanceof Error ? error.message : error}`
			);
		}
	}
}
