import { QueryTypes, Sequelize } from 'sequelize';
import { AppError } from '../errors/ErrorClasses.mjs';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory.mjs';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory.mjs';
import { EnvConfigServiceFactory } from '../index/factory/subfactories/EnvConfigServiceFactory.mjs';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory.mjs';
import { VaultServiceFactory } from '../index/factory/subfactories/VaultServiceFactory.mjs';
export class DatabaseController {
	static instance = null;
	logger;
	errorLogger;
	errorHandler;
	envConfig;
	vault;
	cacheService;
	sequelizeInstance = null;
	attempt = 0;
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		vault,
		cacheService
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.envConfig = envConfig;
		this.vault = vault;
		this.cacheService = cacheService;
		const host = this.envConfig.getEnvVariable('dbHost');
		const username = this.envConfig.getEnvVariable('dbUser');
		const database = this.envConfig.getEnvVariable('dbName');
		const dialect = this.envConfig.getEnvVariable('dbDialect');
		const password = this.vault.retrieveSecret(
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
		const dbConfig = {
			host,
			username,
			password,
			database,
			dialect,
			pool: {
				max: 10,
				min: 0,
				acquire: 30000,
				idle: 10000
			},
			logging: msg => {
				this.logger.debug(msg);
			},
			quoteIdentifiers: false
		};
		this.sequelizeInstance = new Sequelize(dbConfig);
		this.connect();
	}
	static async getInstance() {
		if (!DatabaseController.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const envConfig =
				await EnvConfigServiceFactory.getEnvConfigService();
			const vault = await VaultServiceFactory.getVaultService();
			const cacheService =
				await CacheLayerServiceFactory.getCacheService();
			DatabaseController.instance = new DatabaseController(
				logger,
				errorLogger,
				errorHandler,
				envConfig,
				vault,
				cacheService
			);
		}
		return DatabaseController.instance;
	}
	getSequelizeInstance() {
		if (!this.sequelizeInstance) {
			throw new Error('Sequelize instance is not initialized');
		}
		return this.sequelizeInstance;
	}
	async connect() {
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
				`Database connection failed: ${error.message}`
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
	async initialize() {
		this.logger.info('Initializing database connection...');
		return this.tryInitDB();
	}
	async tryInitDB() {
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
				const sequelizeOptions = {
					host,
					dialect,
					logging: this.envConfig.getFeatureFlags().sequelizeLogging
						? msg => this.logger.info(msg)
						: false
				};
				const dbPassword = this.vault.retrieveSecret(
					'DB_PASSWORD',
					secret => secret
				);
				if (typeof dbPassword !== 'string') {
					this.logger.warn('Valid database password not found');
					throw new Error('Database password not found');
				}
				this.sequelizeInstance = new Sequelize(
					this.envConfig.getEnvVariable('dbName'),
					this.envConfig.getEnvVariable('dbUser'),
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
		} catch (dbError) {
			this.attempt += 1;
			const errorMessage =
				dbError instanceof Error ? dbError.message : 'Unknown error';
			if (
				this.attempt < this.envConfig.getEnvVariable('dbInitMaxRetries')
			) {
				const recoverableError =
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
						this.envConfig.getEnvVariable('dbInitRetryAfter')
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
	async getEntries(Model) {
		const cacheKey = `entries_${Model.name}`;
		const cacheExpiration = 60 * 5;
		try {
			const cachedData = await this.cacheService.get(
				cacheKey,
				'DatabaseController'
			);
			if (cachedData) {
				this.logger.info(`Cache hit for entries in ${Model.name}`);
				return cachedData;
			}
			this.logger.info(
				`Cache miss for entries in ${Model.name}, querying database`
			);
			const entries = await Model.findAll();
			await this.cacheService.set(
				cacheKey,
				entries,
				'DatabaseController',
				cacheExpiration
			);
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
	async createEntry(Model, data) {
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
			return {};
		}
	}
	async deleteEntry(Model, id) {
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
	async clearIdleConnections() {
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
	async cacheData(key, data, expiration) {
		this.logger.info(`Caching data with key: ${key}`);
		try {
			await this.cacheService.set(
				key,
				data,
				'DatabaseController',
				expiration
			);
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
	async queryWithCache(query, cacheKey, expiration) {
		try {
			const service = 'DatabaseController';
			const cachedData = this.cacheService.get(cacheKey, service);
			if (cachedData) {
				this.logger.info(`Cache hit for key: ${cacheKey}`);
				return cachedData;
			}
			this.logger.info(
				`Cache miss for key: ${cacheKey}, querying database`
			);
			const result = await this.sequelizeInstance?.query(query, {
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
			return result ? result : null;
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
	async getCachedData(key) {
		this.logger.info(`Fetching data from CacheService with key: ${key}`);
		try {
			const service = 'DatabaseController';
			return this.cacheService.get(key, service);
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
	async clearCache(key) {
		this.logger.info(`Clearing cache for key: ${key}`);
		try {
			await this.cacheService.del(key, 'DatabaseController');
			this.logger.info(`Cache cleared successfully for key: ${key}`);
		} catch (error) {
			this.errorLogger.logError(
				`Error clearing cache for key ${key}: ${error instanceof Error ? error.message : error}`
			);
			this.handleDBErrorRecoverable(
				error,
				'CLEAR_CACHE_FAILED',
				{ key },
				`Error clearing cache for key ${key}`
			);
		}
	}
	async getDatabaseInfo() {
		const cacheKey = 'dbInfo';
		const cacheExpiration = 30;
		try {
			const cachedData = await this.getCachedData(cacheKey);
			if (cachedData) {
				this.logger.info(`Cache hit for database info`);
				return cachedData;
			}
			this.logger.info(
				`Cache miss for database info, querying the database...`
			);
			const uptimeResult = await this.sequelizeInstance?.query(
				'SELECT EXTRACT(EPOCH FROM current_timestamp - pg_postmaster_start_time()) AS uptime_in_seconds',
				{ type: QueryTypes.SELECT }
			);
			const connectedClientsResult = await this.sequelizeInstance?.query(
				'SELECT COUNT(*) AS connected_clients FROM pg_stat_activity',
				{ type: QueryTypes.SELECT }
			);
			const memoryUsageResult = await this.sequelizeInstance?.query(
				'SELECT pg_database_size(current_database()) AS used_memory',
				{ type: QueryTypes.SELECT }
			);
			const cpuUsageResult = await this.sequelizeInstance?.query(
				'SELECT sum(total_time) as used_cpu_sys FROM pg_stat_statements',
				{ type: QueryTypes.SELECT }
			);
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
	async getDatabaseMetrics(serviceName) {
		try {
			const databaseInfo = await this.getDatabaseInfo();
			const databaseMetrics = {
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
	async shutdown() {
		this.logger.info('Shutting down database controller...');
		try {
			await this.clearIdleConnections();
			this.logger.info('Clearing database cache...');
			await this.cacheService.clearNamespace('DatabaseController');
			this.logger.info('Database cache cleared.');
			this.logger.info('Additional cleanup completed.');
		} catch (error) {
			this.errorLogger.logError(
				`Failed to shut down database controller: ${error instanceof Error ? error.message : error}`
			);
		} finally {
			DatabaseController.instance = null;
			this.logger.info('DatabaseController instance has been nullified.');
		}
	}
	handleDBErrorRecoverable(error, errorHeader, errorDetails, customMessage) {
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
	handleDBErrorFatal(error, errorHeader, errorDetails, customMessage) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YWJhc2VDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbnRyb2xsZXJzL0RhdGFiYXNlQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQVcsVUFBVSxFQUFFLFNBQVMsRUFBVyxNQUFNLFdBQVcsQ0FBQztBQUNwRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFZbEQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sb0RBQW9ELENBQUM7QUFDMUYsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sMERBQTBELENBQUM7QUFDdEcsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sdURBQXVELENBQUM7QUFDaEcsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sd0RBQXdELENBQUM7QUFDbEcsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sbURBQW1ELENBQUM7QUFFeEYsTUFBTSxPQUFPLGtCQUFrQjtJQUN0QixNQUFNLENBQUMsUUFBUSxHQUE4QixJQUFJLENBQUM7SUFFbEQsTUFBTSxDQUE0QjtJQUNsQyxXQUFXLENBQThCO0lBQ3pDLFlBQVksQ0FBK0I7SUFDM0MsU0FBUyxDQUE0QjtJQUNyQyxLQUFLLENBQXdCO0lBQzdCLFlBQVksQ0FBd0I7SUFFcEMsaUJBQWlCLEdBQXFCLElBQUksQ0FBQztJQUMzQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBRXBCLFlBQ0MsTUFBaUMsRUFDakMsV0FBd0MsRUFDeEMsWUFBMEMsRUFDMUMsU0FBb0MsRUFDcEMsS0FBNEIsRUFDNUIsWUFBbUM7UUFFbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFD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QUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7Z0JBQzdCLEtBQUs7Z0JBQ0wsT0FBTyxFQUFFO29CQUNSLE9BQU8sRUFBRSxxQkFBcUI7b0JBQzlCLE1BQU0sRUFBRSw2RUFBNkU7b0JBQ3JGLEtBQUssRUFBRSxnR0FBZ0c7aUJBQ3ZHO2dCQUNELFFBQVE7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9wdGlvbnMsIFF1ZXJ5VHlwZXMsIFNlcXVlbGl6ZSwgRGlhbGVjdCB9IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgeyBBcHBFcnJvciB9IGZyb20gJy4uL2Vycm9ycy9FcnJvckNsYXNzZXMnO1xuaW1wb3J0IHtcblx0QXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0Q2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHREYXRhYmFzZUNvbnRyb2xsZXJJbnRlcmZhY2UsXG5cdEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0VmF1bHRTZXJ2aWNlSW50ZXJmYWNlXG59IGZyb20gJy4uL2luZGV4L2ludGVyZmFjZXMvbWFpbic7XG5pbXBvcnQgeyBNb2RlbE9wZXJhdGlvbnMgfSBmcm9tICcuLi9pbmRleC9pbnRlcmZhY2VzL21vZGVscyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICd3aW5zdG9uJztcbmltcG9ydCB7IExvZ2dlclNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvTG9nZ2VyU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgRXJyb3JIYW5kbGVyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9FcnJvckhhbmRsZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBFbnZDb25maWdTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0VudkNvbmZpZ1NlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IENhY2hlTGF5ZXJTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0NhY2hlTGF5ZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBWYXVsdFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvVmF1bHRTZXJ2aWNlRmFjdG9yeSc7XG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZUNvbnRyb2xsZXIgaW1wbGVtZW50cyBEYXRhYmFzZUNvbnRyb2xsZXJJbnRlcmZhY2Uge1xuXHRwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogRGF0YWJhc2VDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cblx0cHJpdmF0ZSBsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZXJyb3JMb2dnZXI6IEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgZW52Q29uZmlnOiBFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHZhdWx0OiBWYXVsdFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgY2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2U7XG5cblx0cHJpdmF0ZSBzZXF1ZWxpemVJbnN0YW5jZTogU2VxdWVsaXplIHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgYXR0ZW1wdCA9IDA7XG5cblx0cHJpdmF0ZSBjb25zdHJ1Y3Rvcihcblx0XHRsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZXJyb3JMb2dnZXI6IEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZW52Q29uZmlnOiBFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHZhdWx0OiBWYXVsdFNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Y2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2Vcblx0KSB7XG5cdFx0dGhpcy5sb2dnZXIgPSBsb2dnZXI7XG5cdFx0dGhpcy5lcnJvckxvZ2dlciA9IGVycm9yTG9nZ2VyO1xuXHRcdHRoaXMuZXJyb3JIYW5kbGVyID0gZXJyb3JIYW5kbGVyO1xuXHRcdHRoaXMuZW52Q29uZmlnID0gZW52Q29uZmlnO1xuXHRcdHRoaXMudmF1bHQgPSB2YXVsdDtcblx0XHR0aGlzLmNhY2hlU2VydmljZSA9IGNhY2hlU2VydmljZTtcblxuXHRcdGNvbnN0IGhvc3QgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJIb3N0Jyk7XG5cdFx0Y29uc3QgdXNlcm5hbWUgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJVc2VyJyk7XG5cdFx0Y29uc3QgZGF0YWJhc2UgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJOYW1lJyk7XG5cdFx0Y29uc3QgZGlhbGVjdCA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdkYkRpYWxlY3QnKTtcblx0XHRjb25zdCBwYXNzd29yZCA9IHRoaXMudmF1bHQucmV0cmlldmVTZWNyZXQoXG5cdFx0XHQnREJfUEFTU1dPUkQnLFxuXHRcdFx0c2VjcmV0ID0+IHNlY3JldFxuXHRcdCk7XG5cblx0XHRpZiAodHlwZW9mIHBhc3N3b3JkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybignVmFsaWQgZGF0YWJhc2UgcGFzc3dvcmQgbm90IGZvdW5kJyk7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlIHBhc3N3b3JkIG5vdCBmb3VuZCcpO1xuXHRcdH1cblxuXHRcdGlmICghaG9zdCB8fCAhZGF0YWJhc2UgfHwgIXVzZXJuYW1lIHx8ICFkaWFsZWN0KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1JlcXVpcmVkIGRhdGFiYXNlIGNvbmZpZ3VyYXRpb24gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBkYkNvbmZpZzogT3B0aW9ucyA9IHtcblx0XHRcdGhvc3QsXG5cdFx0XHR1c2VybmFtZSxcblx0XHRcdHBhc3N3b3JkLFxuXHRcdFx0ZGF0YWJhc2UsXG5cdFx0XHRkaWFsZWN0OiBkaWFsZWN0IGFzIERpYWxlY3QsXG5cdFx0XHRwb29sOiB7XG5cdFx0XHRcdG1heDogMTAsXG5cdFx0XHRcdG1pbjogMCxcblx0XHRcdFx0YWNxdWlyZTogMzAwMDAsXG5cdFx0XHRcdGlkbGU6IDEwMDAwXG5cdFx0XHR9LFxuXHRcdFx0bG9nZ2luZzogKG1zZzogc3RyaW5nKTogdm9pZCA9PiB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKG1zZyk7XG5cdFx0XHR9LFxuXHRcdFx0cXVvdGVJZGVudGlmaWVyczogZmFsc2Vcblx0XHR9O1xuXG5cdFx0dGhpcy5zZXF1ZWxpemVJbnN0YW5jZSA9IG5ldyBTZXF1ZWxpemUoZGJDb25maWcpO1xuXHRcdHRoaXMuY29ubmVjdCgpO1xuXHR9XG5cblx0cHVibGljIHN0YXRpYyBhc3luYyBnZXRJbnN0YW5jZSgpOiBQcm9taXNlPERhdGFiYXNlQ29udHJvbGxlcj4ge1xuXHRcdGlmICghRGF0YWJhc2VDb250cm9sbGVyLmluc3RhbmNlKSB7XG5cdFx0XHRjb25zdCBsb2dnZXIgPSBhd2FpdCBMb2dnZXJTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlcnJvckxvZ2dlciA9XG5cdFx0XHRcdGF3YWl0IExvZ2dlclNlcnZpY2VGYWN0b3J5LmdldEVycm9yTG9nZ2VyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgZXJyb3JIYW5kbGVyID1cblx0XHRcdFx0YXdhaXQgRXJyb3JIYW5kbGVyU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JIYW5kbGVyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgZW52Q29uZmlnID1cblx0XHRcdFx0YXdhaXQgRW52Q29uZmlnU2VydmljZUZhY3RvcnkuZ2V0RW52Q29uZmlnU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgdmF1bHQgPSBhd2FpdCBWYXVsdFNlcnZpY2VGYWN0b3J5LmdldFZhdWx0U2VydmljZSgpO1xuXHRcdFx0Y29uc3QgY2FjaGVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5LmdldENhY2hlU2VydmljZSgpO1xuXG5cdFx0XHREYXRhYmFzZUNvbnRyb2xsZXIuaW5zdGFuY2UgPSBuZXcgRGF0YWJhc2VDb250cm9sbGVyKFxuXHRcdFx0XHRsb2dnZXIsXG5cdFx0XHRcdGVycm9yTG9nZ2VyLFxuXHRcdFx0XHRlcnJvckhhbmRsZXIsXG5cdFx0XHRcdGVudkNvbmZpZyxcblx0XHRcdFx0dmF1bHQsXG5cdFx0XHRcdGNhY2hlU2VydmljZVxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gRGF0YWJhc2VDb250cm9sbGVyLmluc3RhbmNlO1xuXHR9XG5cblx0cHVibGljIGdldFNlcXVlbGl6ZUluc3RhbmNlKCk6IFNlcXVlbGl6ZSB7XG5cdFx0aWYgKCF0aGlzLnNlcXVlbGl6ZUluc3RhbmNlKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1NlcXVlbGl6ZSBpbnN0YW5jZSBpcyBub3QgaW5pdGlhbGl6ZWQnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5zZXF1ZWxpemVJbnN0YW5jZTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY29ubmVjdCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0aGlzLnNlcXVlbGl6ZUluc3RhbmNlKSB7XG5cdFx0XHRcdHRocm93IG5ldyBBcHBFcnJvcihcblx0XHRcdFx0XHQnU2VxdWVsaXplIGluc3RhbmNlIGlzIG5vdCBpbml0aWFsaXplZCcsXG5cdFx0XHRcdFx0NTAwXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IHRoaXMuc2VxdWVsaXplSW5zdGFuY2UuYXV0aGVudGljYXRlKCk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdDb25uZWN0ZWQgdG8gdGhlIGRhdGFiYXNlJyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBEYXRhYmFzZSBjb25uZWN0aW9uIGZhaWxlZDogJHsoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2V9YFxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IGRiQ29ubmVjdGlvbkVycm9yID1cblx0XHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5EYXRhYmFzZUVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdFx0J0RhdGFiYXNlIGNvbm5lY3Rpb24gZmFpbGVkJyxcblx0XHRcdFx0XHR7IG9yaWdpbmFsRXJyb3I6IGVycm9yIH1cblx0XHRcdFx0KTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcblx0XHRcdFx0ZXJyb3I6IGRiQ29ubmVjdGlvbkVycm9yLFxuXHRcdFx0XHRkZXRhaWxzOiB7IHJlYXNvbjogJ0RhdGFiYXNlIGNvbm5lY3Rpb24gZmFpbGVkJyB9XG5cdFx0XHR9KTtcblx0XHRcdHRocm93IGRiQ29ubmVjdGlvbkVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8U2VxdWVsaXplPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnSW5pdGlhbGl6aW5nIGRhdGFiYXNlIGNvbm5lY3Rpb24uLi4nKTtcblx0XHRyZXR1cm4gdGhpcy50cnlJbml0REIoKTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdHJ5SW5pdERCKCk6IFByb21pc2U8U2VxdWVsaXplPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGlmICghdGhpcy5zZXF1ZWxpemVJbnN0YW5jZSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdGBTZXF1ZWxpemUgbG9nZ2luZyBzZXQgdG8gJHt0aGlzLmVudkNvbmZpZy5nZXRGZWF0dXJlRmxhZ3MoKS5zZXF1ZWxpemVMb2dnaW5nfWBcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRjb25zdCBob3N0ID0gdGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2RiSG9zdCcpO1xuXHRcdFx0XHRjb25zdCBkaWFsZWN0ID0gdGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2RiRGlhbGVjdCcpO1xuXG5cdFx0XHRcdGlmICghaG9zdCB8fCAhZGlhbGVjdCkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignRGF0YWJhc2UgaG9zdCBvciBkaWFsZWN0IGlzIG1pc3NpbmcuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBzZXF1ZWxpemVPcHRpb25zOiBPcHRpb25zID0ge1xuXHRcdFx0XHRcdGhvc3QsXG5cdFx0XHRcdFx0ZGlhbGVjdDogZGlhbGVjdCBhcyBEaWFsZWN0LFxuXHRcdFx0XHRcdGxvZ2dpbmc6IHRoaXMuZW52Q29uZmlnLmdldEZlYXR1cmVGbGFncygpLnNlcXVlbGl6ZUxvZ2dpbmdcblx0XHRcdFx0XHRcdD8gKG1zZzogc3RyaW5nKTogTG9nZ2VyID0+IHRoaXMubG9nZ2VyLmluZm8obXNnKVxuXHRcdFx0XHRcdFx0OiBmYWxzZVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnN0IGRiUGFzc3dvcmQgPSB0aGlzLnZhdWx0LnJldHJpZXZlU2VjcmV0KFxuXHRcdFx0XHRcdCdEQl9QQVNTV09SRCcsXG5cdFx0XHRcdFx0c2VjcmV0ID0+IHNlY3JldFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGlmICh0eXBlb2YgZGJQYXNzd29yZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKCdWYWxpZCBkYXRhYmFzZSBwYXNzd29yZCBub3QgZm91bmQnKTtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlIHBhc3N3b3JkIG5vdCBmb3VuZCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5zZXF1ZWxpemVJbnN0YW5jZSA9IG5ldyBTZXF1ZWxpemUoXG5cdFx0XHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2RiTmFtZScpIGFzIHN0cmluZyxcblx0XHRcdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJVc2VyJykgYXMgc3RyaW5nLFxuXHRcdFx0XHRcdGRiUGFzc3dvcmQsXG5cdFx0XHRcdFx0c2VxdWVsaXplT3B0aW9uc1xuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGF3YWl0IHRoaXMuc2VxdWVsaXplSW5zdGFuY2UuYXV0aGVudGljYXRlKCk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0J0Nvbm5lY3Rpb24gaGFzIGJlZW4gZXN0YWJsaXNoZWQgc3VjY2Vzc2Z1bGx5Lidcblx0XHRcdFx0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0RhdGFiYXNlIGNvbm5lY3Rpb24gYWxyZWFkeSBpbml0aWFsaXplZC4nKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXMuc2VxdWVsaXplSW5zdGFuY2U7XG5cdFx0fSBjYXRjaCAoZGJFcnJvcjogdW5rbm93bikge1xuXHRcdFx0dGhpcy5hdHRlbXB0ICs9IDE7XG5cdFx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPVxuXHRcdFx0XHRkYkVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBkYkVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcic7XG5cblx0XHRcdGlmIChcblx0XHRcdFx0dGhpcy5hdHRlbXB0IDxcblx0XHRcdFx0KHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdkYkluaXRNYXhSZXRyaWVzJykgYXMgbnVtYmVyKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGNvbnN0IHJlY292ZXJhYmxlRXJyb3I6IEFwcEVycm9yID1cblx0XHRcdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0XHRcdGBEYXRhYmFzZSBjb25uZWN0aW9uIGF0dGVtcHQgJHt0aGlzLmF0dGVtcHR9IGZhaWxlZFxcblJldHJ5aW5nLi4uYCxcblx0XHRcdFx0XHRcdHsgb3JpZ2luYWxFcnJvcjogZGJFcnJvciB9XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihyZWNvdmVyYWJsZUVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yOiByZWNvdmVyYWJsZUVycm9yIH0pO1xuXHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRcdGBSZXRyeWluZyBkYXRhYmFzZSBjb25uZWN0aW9uIGluICR7dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2RiSW5pdFJldHJ5QWZ0ZXInKX0gc2Vjb25kcy4uLmBcblx0XHRcdFx0KTtcblx0XHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PlxuXHRcdFx0XHRcdHNldFRpbWVvdXQoXG5cdFx0XHRcdFx0XHRyZXNvbHZlLFxuXHRcdFx0XHRcdFx0dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoXG5cdFx0XHRcdFx0XHRcdCdkYkluaXRSZXRyeUFmdGVyJ1xuXHRcdFx0XHRcdFx0KSBhcyBudW1iZXJcblx0XHRcdFx0XHQpXG5cdFx0XHRcdCk7XG5cdFx0XHRcdHJldHVybiB0aGlzLnRyeUluaXREQigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgZmF0YWxFcnJvciA9XG5cdFx0XHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5EYXRhYmFzZUVycm9yRmF0YWwoXG5cdFx0XHRcdFx0XHRgRmFpbGVkIHRvIGF1dGhlbnRpY2F0ZSBkYXRhYmFzZSBjb25uZWN0aW9uIGFmdGVyICR7dGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2RiSW5pdE1heFJldHJpZXMnKX0gYXR0ZW1wdHM6ICR7ZXJyb3JNZXNzYWdlfWAsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdG9yaWdpbmFsRXJyb3I6IGRiRXJyb3IsXG5cdFx0XHRcdFx0XHRcdGV4cG9zZVRvQ2xpZW50OiBmYWxzZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoZmF0YWxFcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0dGhyb3cgZmF0YWxFcnJvcjtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2V0RW50cmllczxUPihNb2RlbDogTW9kZWxPcGVyYXRpb25zPFQ+KTogUHJvbWlzZTxUW10+IHtcblx0XHRjb25zdCBjYWNoZUtleSA9IGBlbnRyaWVzXyR7TW9kZWwubmFtZX1gO1xuXHRcdGNvbnN0IGNhY2hlRXhwaXJhdGlvbiA9IDYwICogNTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBjYWNoZWREYXRhID0gYXdhaXQgdGhpcy5jYWNoZVNlcnZpY2UuZ2V0PFRbXT4oXG5cdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHQnRGF0YWJhc2VDb250cm9sbGVyJ1xuXHRcdFx0KTtcblx0XHRcdGlmIChjYWNoZWREYXRhKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oYENhY2hlIGhpdCBmb3IgZW50cmllcyBpbiAke01vZGVsLm5hbWV9YCk7XG5cdFx0XHRcdHJldHVybiBjYWNoZWREYXRhO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRgQ2FjaGUgbWlzcyBmb3IgZW50cmllcyBpbiAke01vZGVsLm5hbWV9LCBxdWVyeWluZyBkYXRhYmFzZWBcblx0XHRcdCk7XG5cblx0XHRcdGNvbnN0IGVudHJpZXMgPSBhd2FpdCBNb2RlbC5maW5kQWxsKCk7XG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHRlbnRyaWVzLFxuXHRcdFx0XHQnRGF0YWJhc2VDb250cm9sbGVyJyxcblx0XHRcdFx0Y2FjaGVFeHBpcmF0aW9uXG5cdFx0XHQpO1xuXG5cdFx0XHRyZXR1cm4gZW50cmllcztcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIGZldGNoaW5nIGVudHJpZXMgZnJvbSAke01vZGVsLm5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlREJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0dFVF9FTlRSSUVTX0ZBSUxFRCcsXG5cdFx0XHRcdHsgbW9kZWw6IE1vZGVsLm5hbWUgfSxcblx0XHRcdFx0YEVycm9yIGZldGNoaW5nIGVudHJpZXMgZnJvbSAke01vZGVsLm5hbWV9YFxuXHRcdFx0KTtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgY3JlYXRlRW50cnk8VD4oXG5cdFx0TW9kZWw6IE1vZGVsT3BlcmF0aW9uczxUPixcblx0XHRkYXRhOiBUXG5cdCk6IFByb21pc2U8VD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBuZXdFbnRyeSA9IGF3YWl0IE1vZGVsLmNyZWF0ZShkYXRhKTtcblx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBDcmVhdGVkIG5ldyBlbnRyeSBpbiAke01vZGVsLm5hbWV9YCk7XG5cblx0XHRcdGF3YWl0IHRoaXMuY2xlYXJDYWNoZShgZW50cmllc18ke01vZGVsLm5hbWV9YCk7XG5cblx0XHRcdHJldHVybiBuZXdFbnRyeTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIGNyZWF0aW5nIGVudHJ5IGluICR7TW9kZWwubmFtZX06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5oYW5kbGVEQkVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnQ1JFQVRFX0VOVFJZX0ZBSUxFRCcsXG5cdFx0XHRcdHsgbW9kZWw6IE1vZGVsLm5hbWUgfSxcblx0XHRcdFx0YEVycm9yIGNyZWF0aW5nIGVudHJ5IGluICR7TW9kZWwubmFtZX1gXG5cdFx0XHQpO1xuXHRcdFx0cmV0dXJuIHt9IGFzIFQ7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGRlbGV0ZUVudHJ5PFQ+KFxuXHRcdE1vZGVsOiBNb2RlbE9wZXJhdGlvbnM8VD4sXG5cdFx0aWQ6IG51bWJlclxuXHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZGVsZXRlZCA9IGF3YWl0IE1vZGVsLmRlc3Ryb3koeyB3aGVyZTogeyBpZCB9IH0pO1xuXHRcdFx0aWYgKCFkZWxldGVkKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKFxuXHRcdFx0XHRcdGAke01vZGVsLm5hbWV9IGVudHJ5IHdpdGggaWQgJHtpZH0gbm90IGZvdW5kYFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oYERlbGV0ZWQgJHtNb2RlbC5uYW1lfSBlbnRyeSB3aXRoIGlkICR7aWR9YCk7XG5cdFx0XHRhd2FpdCB0aGlzLmNsZWFyQ2FjaGUoYGVudHJpZXNfJHtNb2RlbC5uYW1lfWApO1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIGRlbGV0aW5nIGVudHJ5IGZyb20gJHtNb2RlbC5uYW1lfTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBkYkRlbGV0ZUVudHJ5RXJyb3IgPVxuXHRcdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0XHRgREIgRW50cnkgRGVsZXRpb246IEVycm9yIGRlbGV0aW5nIGVudHJ5IGZyb20gJHtNb2RlbC5uYW1lfTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWAsXG5cdFx0XHRcdFx0eyBvcmlnaW5hbEVycm9yOiBlcnJvciwgZXhwb3NlVG9DbGllbnQ6IGZhbHNlIH1cblx0XHRcdFx0KTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcblx0XHRcdFx0ZXJyb3I6IGRiRGVsZXRlRW50cnlFcnJvcixcblx0XHRcdFx0ZGV0YWlsczogeyBhY3Rpb246ICdkZWxldGVFbnRyeScsIG1vZGVsOiBNb2RlbC5uYW1lLCBpZCB9XG5cdFx0XHR9KTtcblx0XHRcdHRocm93IG5ldyBBcHBFcnJvcignQ291bGQgbm90IGRlbGV0ZSBlbnRyeScsIDUwMCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGNsZWFySWRsZUNvbm5lY3Rpb25zKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRpZiAodGhpcy5zZXF1ZWxpemVJbnN0YW5jZSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdCdDaGVja2luZyBmb3IgaWRsZSBkYXRhYmFzZSBjb25uZWN0aW9ucyB0byBjbG9zZSdcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRhd2FpdCB0aGlzLnNlcXVlbGl6ZUluc3RhbmNlLmNsb3NlKCk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0FsbCBkYXRhYmFzZSBjb25uZWN0aW9ucyBoYXZlIGJlZW4gY2xvc2VkJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRcdCdObyBTZXF1ZWxpemUgaW5zdGFuY2UgYXZhaWxhYmxlIHRvIGNsb3NlIGNvbm5lY3Rpb25zJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgY2xvc2luZyBkYXRhYmFzZSBjb25uZWN0aW9uczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBjbGVhckRCRENvbm5lY3Rpb25zRXJyb3IgPVxuXHRcdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0XHRgRXJyb3IgY2xvc2luZyBkYXRhYmFzZSBjb25uZWN0aW9uczogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWAsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0b3JpZ2luYWxFcnJvcjogZXJyb3IsXG5cdFx0XHRcdFx0XHRleHBvc2VUb0NsaWVudDogZmFsc2Vcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yOiBjbGVhckRCRENvbm5lY3Rpb25zRXJyb3IgfSk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGNhY2hlRGF0YTxUPihcblx0XHRrZXk6IHN0cmluZyxcblx0XHRkYXRhOiBULFxuXHRcdGV4cGlyYXRpb24/OiBudW1iZXJcblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhgQ2FjaGluZyBkYXRhIHdpdGgga2V5OiAke2tleX1gKTtcblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2V0PFQ+KFxuXHRcdFx0XHRrZXksXG5cdFx0XHRcdGRhdGEsXG5cdFx0XHRcdCdEYXRhYmFzZUNvbnRyb2xsZXInLFxuXHRcdFx0XHRleHBpcmF0aW9uXG5cdFx0XHQpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgY2FjaGluZyBkYXRhIHdpdGgga2V5ICR7a2V5fTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZURCRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdDQUNISU5HX0RBVEFfRkFJTEVEJyxcblx0XHRcdFx0eyBrZXkgfSxcblx0XHRcdFx0YEVycm9yIGNhY2hpbmcgZGF0YSB3aXRoIGtleSAke2tleX1gXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBxdWVyeVdpdGhDYWNoZTxUIGV4dGVuZHMgb2JqZWN0Pihcblx0XHRxdWVyeTogc3RyaW5nLFxuXHRcdGNhY2hlS2V5OiBzdHJpbmcsXG5cdFx0ZXhwaXJhdGlvbj86IG51bWJlclxuXHQpOiBQcm9taXNlPFQgfCBudWxsPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHNlcnZpY2UgPSAnRGF0YWJhc2VDb250cm9sbGVyJztcblx0XHRcdGNvbnN0IGNhY2hlZERhdGEgPSB0aGlzLmNhY2hlU2VydmljZS5nZXQoY2FjaGVLZXksIHNlcnZpY2UpO1xuXHRcdFx0aWYgKGNhY2hlZERhdGEpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgQ2FjaGUgaGl0IGZvciBrZXk6ICR7Y2FjaGVLZXl9YCk7XG5cdFx0XHRcdHJldHVybiBjYWNoZWREYXRhIGFzIFQ7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdGBDYWNoZSBtaXNzIGZvciBrZXk6ICR7Y2FjaGVLZXl9LCBxdWVyeWluZyBkYXRhYmFzZWBcblx0XHRcdCk7XG5cblx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2VxdWVsaXplSW5zdGFuY2U/LnF1ZXJ5PFQ+KHF1ZXJ5LCB7XG5cdFx0XHRcdHR5cGU6IFF1ZXJ5VHlwZXMuU0VMRUNUXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdGBTdG9yaW5nIHJlc3VsdCBpbiBjYWNoZSB3aXRoIGtleTogJHtjYWNoZUtleX1gXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0aWYgKGV4cGlyYXRpb24pIHtcblx0XHRcdFx0XHRjb25zdCBleHBpcmF0aW9uU3RyID0gYCR7ZXhwaXJhdGlvbn1gO1xuXHRcdFx0XHRcdHRoaXMuY2FjaGVTZXJ2aWNlLnNldChjYWNoZUtleSwgcmVzdWx0LCBleHBpcmF0aW9uU3RyKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmNhY2hlU2VydmljZS5zZXQoY2FjaGVLZXksIHJlc3VsdCwgc2VydmljZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHJlc3VsdCA/IChyZXN1bHQgYXMgVCkgOiBudWxsO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgcXVlcnlpbmcgZGF0YWJhc2Ugd2l0aCBjYWNoZTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZURCRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdRVUVSWV9XSVRIX0NBQ0hFX0ZBSUxFRCcsXG5cdFx0XHRcdHsgcXVlcnksIGNhY2hlS2V5IH0sXG5cdFx0XHRcdGBFcnJvciBxdWVyeWluZyBkYXRhYmFzZSB3aXRoIGNhY2hlOiAke2Vycm9yfWBcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2V0Q2FjaGVkRGF0YTxUPihrZXk6IHN0cmluZyk6IFByb21pc2U8VCB8IG51bGw+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKGBGZXRjaGluZyBkYXRhIGZyb20gQ2FjaGVTZXJ2aWNlIHdpdGgga2V5OiAke2tleX1gKTtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc2VydmljZSA9ICdEYXRhYmFzZUNvbnRyb2xsZXInO1xuXHRcdFx0cmV0dXJuIHRoaXMuY2FjaGVTZXJ2aWNlLmdldDxUPihrZXksIHNlcnZpY2UpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgZmV0Y2hpbmcgZGF0YSBmcm9tIENhY2hlU2VydmljZSB3aXRoIGtleSAke2tleX06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0Y29uc3QgY2FjaGVFcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRcdGBFcnJvciBmZXRjaGluZyBkYXRhIGZyb20gQ2FjaGVTZXJ2aWNlIHdpdGgga2V5ICR7a2V5fTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWAsXG5cdFx0XHRcdFx0eyBvcmlnaW5hbEVycm9yOiBlcnJvciwgZXhwb3NlVG9DbGllbnQ6IGZhbHNlIH1cblx0XHRcdFx0KTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3I6IGNhY2hlRXJyb3IgfSk7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgY2xlYXJDYWNoZShrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oYENsZWFyaW5nIGNhY2hlIGZvciBrZXk6ICR7a2V5fWApO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5kZWwoa2V5LCAnRGF0YWJhc2VDb250cm9sbGVyJyk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBDYWNoZSBjbGVhcmVkIHN1Y2Nlc3NmdWxseSBmb3Iga2V5OiAke2tleX1gKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIGNsZWFyaW5nIGNhY2hlIGZvciBrZXkgJHtrZXl9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlREJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0NMRUFSX0NBQ0hFX0ZBSUxFRCcsXG5cdFx0XHRcdHsga2V5IH0sXG5cdFx0XHRcdGBFcnJvciBjbGVhcmluZyBjYWNoZSBmb3Iga2V5ICR7a2V5fWBcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGdldERhdGFiYXNlSW5mbygpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XG5cdFx0Y29uc3QgY2FjaGVLZXkgPSAnZGJJbmZvJztcblx0XHRjb25zdCBjYWNoZUV4cGlyYXRpb24gPSAzMDtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgY2FjaGVkRGF0YSA9XG5cdFx0XHRcdGF3YWl0IHRoaXMuZ2V0Q2FjaGVkRGF0YTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4oY2FjaGVLZXkpO1xuXHRcdFx0aWYgKGNhY2hlZERhdGEpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgQ2FjaGUgaGl0IGZvciBkYXRhYmFzZSBpbmZvYCk7XG5cdFx0XHRcdHJldHVybiBjYWNoZWREYXRhO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRgQ2FjaGUgbWlzcyBmb3IgZGF0YWJhc2UgaW5mbywgcXVlcnlpbmcgdGhlIGRhdGFiYXNlLi4uYFxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgdXB0aW1lUmVzdWx0ID0gKGF3YWl0IHRoaXMuc2VxdWVsaXplSW5zdGFuY2U/LnF1ZXJ5KFxuXHRcdFx0XHQnU0VMRUNUIEVYVFJBQ1QoRVBPQ0ggRlJPTSBjdXJyZW50X3RpbWVzdGFtcCAtIHBnX3Bvc3RtYXN0ZXJfc3RhcnRfdGltZSgpKSBBUyB1cHRpbWVfaW5fc2Vjb25kcycsXG5cdFx0XHRcdHsgdHlwZTogUXVlcnlUeXBlcy5TRUxFQ1QgfVxuXHRcdFx0KSkgYXMgW3sgdXB0aW1lX2luX3NlY29uZHM6IG51bWJlciB9XTtcblx0XHRcdGNvbnN0IGNvbm5lY3RlZENsaWVudHNSZXN1bHQgPSAoYXdhaXQgdGhpcy5zZXF1ZWxpemVJbnN0YW5jZT8ucXVlcnkoXG5cdFx0XHRcdCdTRUxFQ1QgQ09VTlQoKikgQVMgY29ubmVjdGVkX2NsaWVudHMgRlJPTSBwZ19zdGF0X2FjdGl2aXR5Jyxcblx0XHRcdFx0eyB0eXBlOiBRdWVyeVR5cGVzLlNFTEVDVCB9XG5cdFx0XHQpKSBhcyBbeyBjb25uZWN0ZWRfY2xpZW50czogbnVtYmVyIH1dO1xuXHRcdFx0Y29uc3QgbWVtb3J5VXNhZ2VSZXN1bHQgPSAoYXdhaXQgdGhpcy5zZXF1ZWxpemVJbnN0YW5jZT8ucXVlcnkoXG5cdFx0XHRcdCdTRUxFQ1QgcGdfZGF0YWJhc2Vfc2l6ZShjdXJyZW50X2RhdGFiYXNlKCkpIEFTIHVzZWRfbWVtb3J5Jyxcblx0XHRcdFx0eyB0eXBlOiBRdWVyeVR5cGVzLlNFTEVDVCB9XG5cdFx0XHQpKSBhcyBbeyB1c2VkX21lbW9yeTogbnVtYmVyIH1dO1xuXHRcdFx0Y29uc3QgY3B1VXNhZ2VSZXN1bHQgPSAoYXdhaXQgdGhpcy5zZXF1ZWxpemVJbnN0YW5jZT8ucXVlcnkoXG5cdFx0XHRcdCdTRUxFQ1Qgc3VtKHRvdGFsX3RpbWUpIGFzIHVzZWRfY3B1X3N5cyBGUk9NIHBnX3N0YXRfc3RhdGVtZW50cycsXG5cdFx0XHRcdHsgdHlwZTogUXVlcnlUeXBlcy5TRUxFQ1QgfVxuXHRcdFx0KSkgYXMgW3sgdXNlZF9jcHVfc3lzOiBudW1iZXIgfV07XG5cblx0XHRcdGNvbnN0IHVwdGltZUluU2Vjb25kcyA9IHVwdGltZVJlc3VsdD8uWzBdPy51cHRpbWVfaW5fc2Vjb25kcyB8fCAwO1xuXHRcdFx0Y29uc3QgY29ubmVjdGVkQ2xpZW50cyA9XG5cdFx0XHRcdGNvbm5lY3RlZENsaWVudHNSZXN1bHQ/LlswXT8uY29ubmVjdGVkX2NsaWVudHMgfHwgMDtcblx0XHRcdGNvbnN0IHVzZWRNZW1vcnkgPSBtZW1vcnlVc2FnZVJlc3VsdD8uWzBdPy51c2VkX21lbW9yeSB8fCAwO1xuXHRcdFx0Y29uc3QgdXNlZENwdVN5cyA9IGNwdVVzYWdlUmVzdWx0Py5bMF0/LnVzZWRfY3B1X3N5cyB8fCAwO1xuXG5cdFx0XHRjb25zdCBkYkluZm8gPSB7XG5cdFx0XHRcdHVwdGltZV9pbl9zZWNvbmRzOiB1cHRpbWVJblNlY29uZHMsXG5cdFx0XHRcdGNvbm5lY3RlZF9jbGllbnRzOiBjb25uZWN0ZWRDbGllbnRzLFxuXHRcdFx0XHR1c2VkX21lbW9yeTogdXNlZE1lbW9yeSxcblx0XHRcdFx0dXNlZF9jcHVfc3lzOiB1c2VkQ3B1U3lzXG5cdFx0XHR9O1xuXG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlRGF0YShjYWNoZUtleSwgZGJJbmZvLCBjYWNoZUV4cGlyYXRpb24pO1xuXG5cdFx0XHRyZXR1cm4gZGJJbmZvO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgZmV0Y2hpbmcgZGF0YWJhc2UgaW5mbzogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBkYkluZm9FcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRcdCdEYXRhYmFzZSBpbmZvIHJldHJpZXZhbCBmYWlsZWQnLFxuXHRcdFx0XHRcdHsgb3JpZ2luYWxFcnJvcjogZXJyb3IsIGV4cG9zZVRvQ2xpZW50OiBmYWxzZSB9XG5cdFx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZURCRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZGJJbmZvRXJyb3IsXG5cdFx0XHRcdCdEQl9JTkZPX1JFVFJJRVZBTF9GQUlMRUQnLFxuXHRcdFx0XHR7fSxcblx0XHRcdFx0J0RhdGFiYXNlIGluZm8gcmV0cmlldmFsIGZhaWxlZCdcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4ge307XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGdldERhdGFiYXNlTWV0cmljcyhcblx0XHRzZXJ2aWNlTmFtZTogc3RyaW5nXG5cdCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZGF0YWJhc2VJbmZvID0gYXdhaXQgdGhpcy5nZXREYXRhYmFzZUluZm8oKTtcblxuXHRcdFx0Y29uc3QgZGF0YWJhc2VNZXRyaWNzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcblx0XHRcdFx0c2VydmljZTogc2VydmljZU5hbWUsXG5cdFx0XHRcdHN0YXR1czogZGF0YWJhc2VJbmZvID8gJ0Nvbm5lY3RlZCcgOiAnTm90IGNvbm5lY3RlZCcsXG5cdFx0XHRcdHVwdGltZV9pbl9zZWNvbmRzOiBkYXRhYmFzZUluZm8udXB0aW1lX2luX3NlY29uZHMgPz8gMCxcblx0XHRcdFx0Y3B1X3VzZWQ6IGRhdGFiYXNlSW5mby51c2VkX2NwdV9zeXMgPz8gMCxcblx0XHRcdFx0bWVtb3J5X3VzZWQ6IGRhdGFiYXNlSW5mby51c2VkX21lbW9yeSA/PyAwLFxuXHRcdFx0XHRjb25uZWN0ZWRfY2xpZW50czogZGF0YWJhc2VJbmZvLmNvbm5lY3RlZF9jbGllbnRzID8/IDAsXG5cdFx0XHRcdGNhY2hlX3NpemU6IGRhdGFiYXNlSW5mby5jYWNoZVNpemUgPz8gMCxcblx0XHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcblx0XHRcdH07XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdGBEYXRhYmFzZSBtZXRyaWNzIGZvciAke3NlcnZpY2VOYW1lfTogJHtKU09OLnN0cmluZ2lmeShkYXRhYmFzZU1ldHJpY3MpfWBcblx0XHRcdCk7XG5cblx0XHRcdHJldHVybiBkYXRhYmFzZU1ldHJpY3M7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBFcnJvciBmZXRjaGluZyBkYXRhYmFzZSBtZXRyaWNzIGZvciAke3NlcnZpY2VOYW1lfTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZURCRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdEQl9NRVRSSUNTX1JFVFJJRVZBTF9FUlJPUicsXG5cdFx0XHRcdHsgc2VydmljZU5hbWUgfSxcblx0XHRcdFx0YEVycm9yIHJldHJpZXZpbmcgZGF0YWJhc2UgbWV0cmljcyBmb3IgJHtzZXJ2aWNlTmFtZX1gXG5cdFx0XHQpO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c2VydmljZTogc2VydmljZU5hbWUsXG5cdFx0XHRcdHN0YXR1czogJ0Vycm9yIHJldHJpZXZpbmcgbWV0cmljcydcblx0XHRcdH07XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIHNodXRkb3duKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oJ1NodXR0aW5nIGRvd24gZGF0YWJhc2UgY29udHJvbGxlci4uLicpO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmNsZWFySWRsZUNvbm5lY3Rpb25zKCk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0NsZWFyaW5nIGRhdGFiYXNlIGNhY2hlLi4uJyk7XG5cblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmNsZWFyTmFtZXNwYWNlKCdEYXRhYmFzZUNvbnRyb2xsZXInKTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnRGF0YWJhc2UgY2FjaGUgY2xlYXJlZC4nKTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQWRkaXRpb25hbCBjbGVhbnVwIGNvbXBsZXRlZC4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEZhaWxlZCB0byBzaHV0IGRvd24gZGF0YWJhc2UgY29udHJvbGxlcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdERhdGFiYXNlQ29udHJvbGxlci5pbnN0YW5jZSA9IG51bGw7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdEYXRhYmFzZUNvbnRyb2xsZXIgaW5zdGFuY2UgaGFzIGJlZW4gbnVsbGlmaWVkLicpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlREJFcnJvclJlY292ZXJhYmxlKFxuXHRcdGVycm9yOiB1bmtub3duLFxuXHRcdGVycm9ySGVhZGVyOiBzdHJpbmcsXG5cdFx0ZXJyb3JEZXRhaWxzOiBvYmplY3QsXG5cdFx0Y3VzdG9tTWVzc2FnZTogc3RyaW5nXG5cdCk6IHZvaWQge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSBgJHtjdXN0b21NZXNzYWdlfTogJHtlcnJvcn1cXG4ke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5zdGFjayA6ICcnfWA7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKGVycm9yTWVzc2FnZSk7XG5cblx0XHRcdGNvbnN0IHJlc291cmNlRXJyb3IgPVxuXHRcdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0XHRlcnJvckhlYWRlcixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkZXRhaWxzOiBlcnJvckRldGFpbHMsXG5cdFx0XHRcdFx0XHRleHBvc2VUb0NsaWVudDogZmFsc2Vcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcblx0XHRcdFx0ZXJyb3I6IHJlc291cmNlRXJyb3Jcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGhhbmRsaW5nIHJlc291cmNlIG1hbmFnZXIgZXJyb3I6ICR7ZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IHNldmVyaXR5ID0gdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JTZXZlcml0eS5XQVJOSU5HO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0ZGV0YWlsczoge1xuXHRcdFx0XHRcdGNvbnRleHQ6ICdEYXRhYmFzZSBDb250cm9sbGVyJyxcblx0XHRcdFx0XHRhY3Rpb246ICdQYXNzaW5nIGVycm9yIGZyb20gRGF0YWJhc2UgQ29udHJvbGxlciBlcnJvciBoYW5kbGVyIHRvIEVycm9ySGFuZGxlclNlcnZpY2UnLFxuXHRcdFx0XHRcdG5vdGVzOiAnRXJyb3Igb2NjdXJyZWQgd2hpbGUgaGFuZGxpbmcgRGF0YWJhc2UgQ29udHJvbGxlciBlcnJvcjogRGF0YWJhc2VDb250cm9sbGVyLmhhbmRsZURCRXJyb3JSZWNvdmVyYWJsZSdcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V2ZXJpdHlcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlREJFcnJvckZhdGFsKFxuXHRcdGVycm9yOiB1bmtub3duLFxuXHRcdGVycm9ySGVhZGVyOiBzdHJpbmcsXG5cdFx0ZXJyb3JEZXRhaWxzOiBvYmplY3QsXG5cdFx0Y3VzdG9tTWVzc2FnZTogc3RyaW5nXG5cdCk6IHZvaWQge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBlcnJvck1lc3NhZ2UgPSBgJHtjdXN0b21NZXNzYWdlfTogJHtlcnJvcn1cXG4ke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5zdGFjayA6ICcnfWA7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKGVycm9yTWVzc2FnZSk7XG5cblx0XHRcdGNvbnN0IHJlc291cmNlRXJyb3IgPVxuXHRcdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JGYXRhbChcblx0XHRcdFx0XHRlcnJvckhlYWRlcixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkZXRhaWxzOiBlcnJvckRldGFpbHMsXG5cdFx0XHRcdFx0XHRleHBvc2VUb0NsaWVudDogZmFsc2Vcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcblx0XHRcdFx0ZXJyb3I6IHJlc291cmNlRXJyb3Jcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGhhbmRsaW5nIHJlc291cmNlIG1hbmFnZXIgZXJyb3I6ICR7ZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IHNldmVyaXR5ID0gdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JTZXZlcml0eS5XQVJOSU5HO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0ZGV0YWlsczoge1xuXHRcdFx0XHRcdGNvbnRleHQ6ICdEYXRhYmFzZSBDb250cm9sbGVyJyxcblx0XHRcdFx0XHRhY3Rpb246ICdQYXNzaW5nIGVycm9yIGZyb20gRGF0YWJhc2UgQ29udHJvbGxlciBlcnJvciBoYW5kbGVyIHRvIEVycm9ySGFuZGxlclNlcnZpY2UnLFxuXHRcdFx0XHRcdG5vdGVzOiAnRXJyb3Igb2NjdXJyZWQgd2hpbGUgaGFuZGxpbmcgRGF0YWJhc2UgQ29udHJvbGxlciBlcnJvcjogRGF0YWJhc2VDb250cm9sbGVyLmhhbmRsZURCRXJyb3JGYXRhbCdcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V2ZXJpdHlcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufVxuIl19
