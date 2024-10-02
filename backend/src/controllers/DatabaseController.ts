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
	private cacheService = ServiceFactory.getCacheService();
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
		const cacheKey = `entries_${Model.name}`;
		const cacheExpiration = 60 * 5;

		try {
			const cachedData = await this.getCachedData<T[]>(cacheKey);
			if (cachedData) {
				this.logger.info(`Cache hit for entries in ${Model.name}`);
				return cachedData;
			}

			this.logger.info(
				`Cache miss for entries in ${Model.name}, querying database`
			);

			const entries = await Model.findAll();
			await this.cacheData(cacheKey, entries, cacheExpiration);

			return entries;
		} catch (error) {
			this.errorLogger.logError(
				`Error fetching entries from ${Model.name}: ${error instanceof Error ? error.message : error}`
			);
			this.handleDBErrorRecoverable(
				error,
				'GET_ENTRIES_FAILED',
				{ model: Model.name },
				`Error fetching entries from ${Model.name}`
			);
			return [];
		}
	}

	public async createEntry<T>(
		Model: ModelOperations<T>,
		data: T
	): Promise<T> {
		try {
			const newEntry = await Model.create(data);
			this.logger.debug(`Created new entry in ${Model.name}`);

			await this.clearCache(`entries_${Model.name}`);

			return newEntry;
		} catch (error) {
			this.errorLogger.logError(
				`Error creating entry in ${Model.name}: ${error instanceof Error ? error.message : error}`
			);
			this.handleDBErrorRecoverable(
				error,
				'CREATE_ENTRY_FAILED',
				{ model: Model.name },
				`Error creating entry in ${Model.name}`
			);
			return {} as T;
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

			await this.clearCache(`entries_${Model.name}`);

			return true;
		} catch (error) {
			this.errorLogger.logError(
				`Error deleting entry from ${Model.name}: ${error instanceof Error ? error.message : error}`
			);
			const dbDeleteEntryError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`DB Entry Deletion: Error deleting entry from ${Model.name}: ${error instanceof Error ? error.message : error}`,
					{ originalError: error, exposeToClient: false }
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
			this.handleDBErrorRecoverable(
				error,
				'CACHING_DATA_FAILED',
				{ key },
				`Error caching data with key ${key}`
			);
		}
	}

	public async queryWithCache<T extends object>(
		query: string,
		cacheKey: string,
		expiration?: number
	): Promise<T | null> {
		try {
			const service = 'DatabaseController';
			const cachedData = this.cacheService.get(cacheKey, service);
			if (cachedData) {
				this.logger.info(`Cache hit for key: ${cacheKey}`);
				return cachedData as T;
			}

			this.logger.info(
				`Cache miss for key: ${cacheKey}, querying database`
			);

			const result = await this.sequelizeInstance?.query<T>(query, {
				type: QueryTypes.SELECT
			});

			if (result) {
				this.logger.info(
					`Storing result in cache with key: ${cacheKey}`
				);

				if (expiration) {
					const expirationStr = `${expiration}`;
					this.cacheService.set(cacheKey, result, expirationStr);
				} else {
					this.cacheService.set(cacheKey, result, service);
				}
			}

			return result ? (result as T) : null;
		} catch (error) {
			this.errorLogger.logError(
				`Error querying database with cache: ${error instanceof Error ? error.message : error}`
			);
			this.handleDBErrorRecoverable(
				error,
				'QUERY_WITH_CACHE_FAILED',
				{ query, cacheKey },
				`Error querying database with cache: ${error}`
			);
			return null;
		}
	}

	public async getCachedData<T>(key: string): Promise<T | null> {
		this.logger.info(`Fetching data from CacheService with key: ${key}`);
		try {
			const service = 'DatabaseController';
			return this.cacheService.get<T>(key, service);
		} catch (error) {
			this.errorLogger.logError(
				`Error fetching data from CacheService with key ${key}: ${error instanceof Error ? error.message : error}`
			);
			const cacheError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Error fetching data from CacheService with key ${key}: ${error instanceof Error ? error.message : error}`,
					{ originalError: error, exposeToClient: false }
				);
			this.errorHandler.handleError({ error: cacheError });
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

	public async getDatabaseInfo(): Promise<Record<string, unknown>> {
		const cacheKey = 'dbInfo';
		const cacheExpiration = 30;
		try {
			const cachedData =
				await this.getCachedData<Record<string, unknown>>(cacheKey);
			if (cachedData) {
				this.logger.info(`Cache hit for database info`);
				return cachedData;
			}

			this.logger.info(
				`Cache miss for database info, querying the database...`
			);

			const uptimeResult = (await this.sequelizeInstance?.query(
				'SELECT EXTRACT(EPOCH FROM current_timestamp - pg_postmaster_start_time()) AS uptime_in_seconds',
				{ type: QueryTypes.SELECT }
			)) as [{ uptime_in_seconds: number }];
			const connectedClientsResult = (await this.sequelizeInstance?.query(
				'SELECT COUNT(*) AS connected_clients FROM pg_stat_activity',
				{ type: QueryTypes.SELECT }
			)) as [{ connected_clients: number }];
			const memoryUsageResult = (await this.sequelizeInstance?.query(
				'SELECT pg_database_size(current_database()) AS used_memory',
				{ type: QueryTypes.SELECT }
			)) as [{ used_memory: number }];
			const cpuUsageResult = (await this.sequelizeInstance?.query(
				'SELECT sum(total_time) as used_cpu_sys FROM pg_stat_statements',
				{ type: QueryTypes.SELECT }
			)) as [{ used_cpu_sys: number }];

			const uptimeInSeconds = uptimeResult?.[0]?.uptime_in_seconds || 0;
			const connectedClients =
				connectedClientsResult?.[0]?.connected_clients || 0;
			const usedMemory = memoryUsageResult?.[0]?.used_memory || 0;
			const usedCpuSys = cpuUsageResult?.[0]?.used_cpu_sys || 0;

			const dbInfo = {
				uptime_in_seconds: uptimeInSeconds,
				connected_clients: connectedClients,
				used_memory: usedMemory,
				used_cpu_sys: usedCpuSys
			};

			await this.cacheData(cacheKey, dbInfo, cacheExpiration);

			return dbInfo;
		} catch (error) {
			this.errorLogger.logError(
				`Error fetching database info: ${error instanceof Error ? error.message : error}`
			);
			const dbInfoError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Database info retrieval failed',
					{ originalError: error, exposeToClient: false }
				);
			this.handleDBErrorRecoverable(
				dbInfoError,
				'DB_INFO_RETRIEVAL_FAILED',
				{},
				'Database info retrieval failed'
			);
			return {};
		}
	}

	public async getDatabaseMetrics(
		serviceName: string
	): Promise<Record<string, unknown>> {
		try {
			const databaseInfo = await this.getDatabaseInfo();

			const databaseMetrics: Record<string, unknown> = {
				service: serviceName,
				status: databaseInfo ? 'Connected' : 'Not connected',
				uptime_in_seconds: databaseInfo.uptime_in_seconds ?? 0,
				cpu_used: databaseInfo.used_cpu_sys ?? 0,
				memory_used: databaseInfo.used_memory ?? 0,
				connected_clients: databaseInfo.connected_clients ?? 0,
				cache_size: databaseInfo.cacheSize ?? 0,
				timestamp: new Date().toISOString()
			};

			this.logger.info(
				`Database metrics for ${serviceName}: ${JSON.stringify(databaseMetrics)}`
			);

			return databaseMetrics;
		} catch (error) {
			this.errorLogger.logError(
				`Error fetching database metrics for ${serviceName}: ${error instanceof Error ? error.message : error}`
			);
			this.handleDBErrorRecoverable(
				error,
				'DB_METRICS_RETRIEVAL_ERROR',
				{ serviceName },
				`Error retrieving database metrics for ${serviceName}`
			);
			return {
				service: serviceName,
				status: 'Error retrieving metrics'
			};
		}
	}

	private handleDBErrorRecoverable(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		try {
			const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
			this.errorLogger.logError(errorMessage);

			const resourceError =
				new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					errorHeader,
					{
						details: errorDetails,
						exposeToClient: false
					}
				);

			this.errorHandler.handleError({
				error: resourceError
			});
		} catch (error) {
			this.logger.error(
				`Error handling resource manager error: ${error}`
			);
			const severity = this.errorHandler.ErrorSeverity.WARNING;
			this.errorHandler.handleError({
				error,
				details: {
					context: 'Database Controller',
					action: 'Passing error from Database Controller error handler to ErrorHandlerService',
					notes: 'Error occurred while handling Database Controller error: DatabaseController.handleDBErrorRecoverable'
				},
				severity
			});
		}
	}

	private handleDBErrorFatal(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		try {
			const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
			this.errorLogger.logError(errorMessage);

			const resourceError =
				new this.errorHandler.ErrorClasses.DatabaseErrorFatal(
					errorHeader,
					{
						details: errorDetails,
						exposeToClient: false
					}
				);

			this.errorHandler.handleError({
				error: resourceError
			});
		} catch (error) {
			this.logger.error(
				`Error handling resource manager error: ${error}`
			);
			const severity = this.errorHandler.ErrorSeverity.WARNING;
			this.errorHandler.handleError({
				error,
				details: {
					context: 'Database Controller',
					action: 'Passing error from Database Controller error handler to ErrorHandlerService',
					notes: 'Error occurred while handling Database Controller error: DatabaseController.handleDBErrorFatal'
				},
				severity
			});
		}
	}
}
