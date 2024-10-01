import { Options, QueryTypes, Sequelize, Dialect } from 'sequelize';
import { AppError } from '../errors/ErrorClasses';
import {
	DatabaseControllerInterface,
	ModelOperations
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { Logger } from 'winston';

export class DatabaseController implements DatabaseControllerInterface {
	private static instance: DatabaseController;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private envConfig = ServiceFactory.getEnvConfigService();
	private secrets = ServiceFactory.getVaultService();
	private redisService = ServiceFactory.getRedisService();
	private sequelizeInstance: Sequelize | null = null;
	private attempt = 0;

	private constructor() {
		const host = this.envConfig.getEnvVariable('dbHost');
		const username = this.envConfig.getEnvVariable('dbUser');
		const database = this.envConfig.getEnvVariable('dbName');
		const dialect = this.envConfig.getEnvVariable('dbDialect');
		const password = this.secrets.retrieveSecret(
			'DB_PASSWORD',
			secret => secret
		);

		if (typeof password !== 'string') {
			this.logger.warn('Valid database password not found');
			throw new Error('Database password not found');
		}

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

	public static getInstance(): DatabaseController {
		if (!DatabaseController.instance) {
			DatabaseController.instance = new DatabaseController();
		}

		return DatabaseController.instance;
	}

	public getSequelizeInstance(): Sequelize {
		if (!this.sequelizeInstance) {
			throw new Error('Sequelize instance is not initialized');
		}

		return this.sequelizeInstance;
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
		} catch (error) {
			this.errorLogger.logError(
				`Database connection failed: ${(error as Error).message}`
			);
			const dbConnectionError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Database connection failed',
					{ originalError: error }
				);
			this.errorHandler.handleError({
				error: dbConnectionError,
				details: { reason: 'Database connection failed' }
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
					`Sequelize logging set to ${this.envConfig.getFeatureFlags().sequelizeLogging}`
				);

				const host = this.envConfig.getEnvVariable('dbHost');
				const dialect = this.envConfig.getEnvVariable('dbDialect');

				if (!host || !dialect) {
					throw new Error('Database host or dialect is missing.');
				}

				const sequelizeOptions: Options = {
					host,
					dialect: dialect as Dialect,
					logging: this.envConfig.getFeatureFlags().sequelizeLogging
						? (msg: string): Logger => this.logger.info(msg)
						: false
				};

				const dbPassword = this.secrets.retrieveSecret(
					'DB_PASSWORD',
					secret => secret
				);

				if (typeof dbPassword !== 'string') {
					this.logger.warn('Valid database password not found');
					throw new Error('Database password not found');
				}

				this.sequelizeInstance = new Sequelize(
					this.envConfig.getEnvVariable('dbName') as string,
					this.envConfig.getEnvVariable('dbUser') as string,
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
				(this.envConfig.getEnvVariable('dbInitMaxRetries') as number)
			) {
				const recoverableError: AppError =
					new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Database connection attempt ${this.attempt} failed\nRetrying...`,
						{ originalError: dbError }
					);
				this.errorLogger.logError(recoverableError.message);
				this.errorHandler.handleError({ error: recoverableError });
				this.logger.warn(
					`Retrying database connection in ${this.envConfig.getEnvVariable('dbInitRetryAfter')} seconds...`
				);
				await new Promise(resolve =>
					setTimeout(
						resolve,
						this.envConfig.getEnvVariable(
							'dbInitRetryAfter'
						) as number
					)
				);
				return this.tryInitDB();
			} else {
				const fatalError =
					new this.errorHandler.ErrorClasses.DatabaseErrorFatal(
						`Failed to authenticate database connection after ${this.envConfig.getEnvVariable('dbInitMaxRetries')} attempts: ${errorMessage}`,
						{
							originalError: dbError,
							exposeToClient: false
						}
					);
				this.errorLogger.logError(fatalError.message);
				throw fatalError;
			}
		}
	}

	public async getEntries<T>(Model: ModelOperations<T>): Promise<T[]> {
		try {
			const entries = await Model.findAll();
			this.logger.debug(`Fetched all entries from ${Model.name}`);
			return entries;
		} catch (error) {
			this.errorLogger.logError(
				`Error fetching entries from ${Model.name}: ${error instanceof Error ? error.message : error}`
			);
			const dbGetEntriesError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`DB Entry Retrieval: Error fetching entries from ${Model.name}: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({
				error: dbGetEntriesError,
				details: { action: 'getEntries', model: Model.name }
			});
			throw dbGetEntriesError;
		}
	}

	public async createEntry<T>(
		Model: ModelOperations<T>,
		data: T
	): Promise<T> {
		try {
			const newEntry = await Model.create(data);
			this.logger.debug(`Created new entry in ${Model.name}`);
			return newEntry;
		} catch (error) {
			this.errorLogger.logError(
				`Error creating entry in ${Model.name}: ${error instanceof Error ? error.message : error}`
			);
			const dbCreateEntryError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`DB Entry Creation: Error creating entry in ${Model.name}: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({
				error: dbCreateEntryError,
				details: { action: 'createEntry', model: Model.name, data }
			});
			throw dbCreateEntryError;
		}
	}

	public async deleteEntry<T>(
		Model: ModelOperations<T>,
		id: number
	): Promise<boolean> {
		try {
			const deleted = await Model.destroy({ where: { id } });
			if (!deleted) {
				this.logger.debug(
					`${Model.name} entry with id ${id} not found`
				);
				return false;
			}

			this.logger.info(`Deleted ${Model.name} entry with id ${id}`);
			return true;
		} catch (error) {
			this.errorLogger.logError(
				`Error deleting entry from ${Model.name}: ${error instanceof Error ? error.message : error}`
			);
			const dbDeleteEntryError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`DB Entry Deletion: Error deleting entry from ${Model.name}: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({
				error: dbDeleteEntryError,
				details: { action: 'deleteEntry', model: Model.name, id }
			});
			throw new AppError('Could not delete entry', 500);
		}
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
			const clearDBDConnectionsError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Error closing database connections: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({ error: clearDBDConnectionsError });
		}
	}

	public async cacheData<T>(
		key: string,
		data: T,
		expiration?: number
	): Promise<void> {
		this.logger.info(`Caching data with key: ${key}`);
		try {
			await this.redisService.set<T>(key, data, expiration);
		} catch (error) {
			this.errorLogger.logError(
				`Error caching data with key ${key}: ${error instanceof Error ? error.message : error}`
			);
			const dbCacheError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Error caching data with key ${key}: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({ error: dbCacheError });
		}
	}

	public async queryWithCache<T extends object>(
		query: string,
		cacheKey: string,
		expiration?: number
	): Promise<T | null> {
		try {
			const cachedData = await this.getCachedData<T>(cacheKey);
			if (cachedData) {
				this.logger.info(`Cache hit for key: ${cacheKey}`);
				return cachedData;
			}

			this.logger.info(
				`Cache miss for key: ${cacheKey}, querying database`
			);

			const result = await this.sequelizeInstance?.query<T>(query, {
				type: QueryTypes.SELECT
			});

			if (result) {
				await this.cacheData(cacheKey, result, expiration);
			}

			return result ? (result as T) : null;
		} catch (error) {
			this.errorLogger.logError(
				`Error querying database with Redis cache: ${error instanceof Error ? error.message : error}`
			);
			const dbCacheError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Error querying database with Redis cache: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({ error: dbCacheError });
			return null;
		}
	}

	public async getCachedData<T>(key: string): Promise<T | null> {
		this.logger.info(`Fetching data from cache with key: ${key}`);
		try {
			return await this.redisService.get<T>(key);
		} catch (error) {
			this.errorLogger.logError(
				`Error fetching DB data from cache with key ${key}: ${error instanceof Error ? error.message : error}`
			);
			const redisCacheError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Error fetching DB data from Redis cache with key ${key}: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({ error: redisCacheError });
			return null;
		}
	}

	public async clearCache(key: string): Promise<void> {
		this.logger.info(`Clearing cache for key: ${key}`);
		try {
			await this.redisService.del(key);
		} catch (error) {
			this.errorLogger.logError(
				`Error clearing DB Redis cache for key ${key}: ${error instanceof Error ? error.message : error}`
			);
			const redisCacheError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Error clearing DB Redis cache for key ${key}: ${error instanceof Error ? error.message : error}`,
					{
						originalError: error,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({ error: redisCacheError });
		}
	}
}
