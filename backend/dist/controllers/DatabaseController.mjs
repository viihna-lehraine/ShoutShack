import { QueryTypes, Sequelize } from 'sequelize';
import { AppError } from '../errors/ErrorClasses.mjs';
import { ServiceFactory } from '../index/factory.mjs';
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
			const logger = await ServiceFactory.getLoggerService();
			const errorLogger = await ServiceFactory.getErrorLoggerService();
			const errorHandler = await ServiceFactory.getErrorHandlerService();
			const envConfig = await ServiceFactory.getEnvConfigService();
			const vault = await ServiceFactory.getVaultService();
			const cacheService = await ServiceFactory.getCacheService();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YWJhc2VDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbnRyb2xsZXJzL0RhdGFiYXNlQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQVcsVUFBVSxFQUFFLFNBQVMsRUFBVyxNQUFNLFdBQVcsQ0FBQztBQUNwRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFXbEQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBR2xELE1BQU0sT0FBTyxrQkFBa0I7SUFDdEIsTUFBTSxDQUFDLFFBQVEsR0FBOEIsSUFBSSxDQUFDO0lBRWxELE1BQU0sQ0FBNEI7SUFDbEMsV0FBVyxDQUE4QjtJQUN6QyxZQUFZLENBQStCO0lBQzNDLFNBQVMsQ0FBNEI7SUFDckMsS0FBSyxDQUF3QjtJQUM3QixZQUFZLENBQXdCO0lBRXBDLGlCQUFpQixHQUFxQixJQUFJLENBQUM7SUFDM0MsT0FBTyxHQUFHLENBQUMsQ0FBQztJQUVwQixZQUNDLE1BQWlDLEVBQ2pDLFdBQXdDLEVBQ3hDLFlBQTBDLEVBQzFDLFNBQW9DLEVBQ3BDLEtBQTRCLEVBQzVCLFlBQW1DO1FBRW5DLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBRWpDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxD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bXBvcnQgeyBPcHRpb25zLCBRdWVyeVR5cGVzLCBTZXF1ZWxpemUsIERpYWxlY3QgfSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IHsgQXBwRXJyb3IgfSBmcm9tICcuLi9lcnJvcnMvRXJyb3JDbGFzc2VzJztcbmltcG9ydCB7XG5cdEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdENhY2hlU2VydmljZUludGVyZmFjZSxcblx0RGF0YWJhc2VDb250cm9sbGVySW50ZXJmYWNlLFxuXHRFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFcnJvckhhbmRsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFcnJvckxvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFZhdWx0U2VydmljZUludGVyZmFjZVxufSBmcm9tICcuLi9pbmRleC9pbnRlcmZhY2VzL3NlcnZpY2VzJztcbmltcG9ydCB7IE1vZGVsT3BlcmF0aW9ucyB9IGZyb20gJy4uL2luZGV4L2ludGVyZmFjZXMvbW9kZWxzJztcbmltcG9ydCB7IFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeSc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICd3aW5zdG9uJztcblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlQ29udHJvbGxlciBpbXBsZW1lbnRzIERhdGFiYXNlQ29udHJvbGxlckludGVyZmFjZSB7XG5cdHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBEYXRhYmFzZUNvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuXHRwcml2YXRlIGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgdmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBjYWNoZVNlcnZpY2U6IENhY2hlU2VydmljZUludGVyZmFjZTtcblxuXHRwcml2YXRlIHNlcXVlbGl6ZUluc3RhbmNlOiBTZXF1ZWxpemUgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBhdHRlbXB0ID0gMDtcblxuXHRwcml2YXRlIGNvbnN0cnVjdG9yKFxuXHRcdGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0XHRlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0dmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZSxcblx0XHRjYWNoZVNlcnZpY2U6IENhY2hlU2VydmljZUludGVyZmFjZVxuXHQpIHtcblx0XHR0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcblx0XHR0aGlzLmVycm9yTG9nZ2VyID0gZXJyb3JMb2dnZXI7XG5cdFx0dGhpcy5lcnJvckhhbmRsZXIgPSBlcnJvckhhbmRsZXI7XG5cdFx0dGhpcy5lbnZDb25maWcgPSBlbnZDb25maWc7XG5cdFx0dGhpcy52YXVsdCA9IHZhdWx0O1xuXHRcdHRoaXMuY2FjaGVTZXJ2aWNlID0gY2FjaGVTZXJ2aWNlO1xuXG5cdFx0Y29uc3QgaG9zdCA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdkYkhvc3QnKTtcblx0XHRjb25zdCB1c2VybmFtZSA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdkYlVzZXInKTtcblx0XHRjb25zdCBkYXRhYmFzZSA9IHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdkYk5hbWUnKTtcblx0XHRjb25zdCBkaWFsZWN0ID0gdGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2RiRGlhbGVjdCcpO1xuXHRcdGNvbnN0IHBhc3N3b3JkID0gdGhpcy52YXVsdC5yZXRyaWV2ZVNlY3JldChcblx0XHRcdCdEQl9QQVNTV09SRCcsXG5cdFx0XHRzZWNyZXQgPT4gc2VjcmV0XG5cdFx0KTtcblxuXHRcdGlmICh0eXBlb2YgcGFzc3dvcmQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKCdWYWxpZCBkYXRhYmFzZSBwYXNzd29yZCBub3QgZm91bmQnKTtcblx0XHRcdHRocm93IG5ldyBFcnJvcignRGF0YWJhc2UgcGFzc3dvcmQgbm90IGZvdW5kJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFob3N0IHx8ICFkYXRhYmFzZSB8fCAhdXNlcm5hbWUgfHwgIWRpYWxlY3QpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignUmVxdWlyZWQgZGF0YWJhc2UgY29uZmlndXJhdGlvbiBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGRiQ29uZmlnOiBPcHRpb25zID0ge1xuXHRcdFx0aG9zdCxcblx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0cGFzc3dvcmQsXG5cdFx0XHRkYXRhYmFzZSxcblx0XHRcdGRpYWxlY3Q6IGRpYWxlY3QgYXMgRGlhbGVjdCxcblx0XHRcdHBvb2w6IHtcblx0XHRcdFx0bWF4OiAxMCxcblx0XHRcdFx0bWluOiAwLFxuXHRcdFx0XHRhY3F1aXJlOiAzMDAwMCxcblx0XHRcdFx0aWRsZTogMTAwMDBcblx0XHRcdH0sXG5cdFx0XHRsb2dnaW5nOiAobXNnOiBzdHJpbmcpOiB2b2lkID0+IHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcobXNnKTtcblx0XHRcdH0sXG5cdFx0XHRxdW90ZUlkZW50aWZpZXJzOiBmYWxzZVxuXHRcdH07XG5cblx0XHR0aGlzLnNlcXVlbGl6ZUluc3RhbmNlID0gbmV3IFNlcXVlbGl6ZShkYkNvbmZpZyk7XG5cdFx0dGhpcy5jb25uZWN0KCk7XG5cdH1cblxuXHRwdWJsaWMgc3RhdGljIGFzeW5jIGdldEluc3RhbmNlKCk6IFByb21pc2U8RGF0YWJhc2VDb250cm9sbGVyPiB7XG5cdFx0aWYgKCFEYXRhYmFzZUNvbnRyb2xsZXIuaW5zdGFuY2UpIHtcblx0XHRcdGNvbnN0IGxvZ2dlciA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldExvZ2dlclNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGVycm9yTG9nZ2VyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JMb2dnZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlcnJvckhhbmRsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlbnZDb25maWcgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFbnZDb25maWdTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCB2YXVsdCA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldFZhdWx0U2VydmljZSgpO1xuXHRcdFx0Y29uc3QgY2FjaGVTZXJ2aWNlID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0Q2FjaGVTZXJ2aWNlKCk7XG5cblx0XHRcdERhdGFiYXNlQ29udHJvbGxlci5pbnN0YW5jZSA9IG5ldyBEYXRhYmFzZUNvbnRyb2xsZXIoXG5cdFx0XHRcdGxvZ2dlcixcblx0XHRcdFx0ZXJyb3JMb2dnZXIsXG5cdFx0XHRcdGVycm9ySGFuZGxlcixcblx0XHRcdFx0ZW52Q29uZmlnLFxuXHRcdFx0XHR2YXVsdCxcblx0XHRcdFx0Y2FjaGVTZXJ2aWNlXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBEYXRhYmFzZUNvbnRyb2xsZXIuaW5zdGFuY2U7XG5cdH1cblxuXHRwdWJsaWMgZ2V0U2VxdWVsaXplSW5zdGFuY2UoKTogU2VxdWVsaXplIHtcblx0XHRpZiAoIXRoaXMuc2VxdWVsaXplSW5zdGFuY2UpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignU2VxdWVsaXplIGluc3RhbmNlIGlzIG5vdCBpbml0aWFsaXplZCcpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnNlcXVlbGl6ZUluc3RhbmNlO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjb25uZWN0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRpZiAoIXRoaXMuc2VxdWVsaXplSW5zdGFuY2UpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEFwcEVycm9yKFxuXHRcdFx0XHRcdCdTZXF1ZWxpemUgaW5zdGFuY2UgaXMgbm90IGluaXRpYWxpemVkJyxcblx0XHRcdFx0XHQ1MDBcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5zZXF1ZWxpemVJbnN0YW5jZS5hdXRoZW50aWNhdGUoKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0Nvbm5lY3RlZCB0byB0aGUgZGF0YWJhc2UnKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YERhdGFiYXNlIGNvbm5lY3Rpb24gZmFpbGVkOiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gXG5cdFx0XHQpO1xuXHRcdFx0Y29uc3QgZGJDb25uZWN0aW9uRXJyb3IgPVxuXHRcdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0XHQnRGF0YWJhc2UgY29ubmVjdGlvbiBmYWlsZWQnLFxuXHRcdFx0XHRcdHsgb3JpZ2luYWxFcnJvcjogZXJyb3IgfVxuXHRcdFx0XHQpO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0XHRlcnJvcjogZGJDb25uZWN0aW9uRXJyb3IsXG5cdFx0XHRcdGRldGFpbHM6IHsgcmVhc29uOiAnRGF0YWJhc2UgY29ubmVjdGlvbiBmYWlsZWQnIH1cblx0XHRcdH0pO1xuXHRcdFx0dGhyb3cgZGJDb25uZWN0aW9uRXJyb3I7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTxTZXF1ZWxpemU+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKCdJbml0aWFsaXppbmcgZGF0YWJhc2UgY29ubmVjdGlvbi4uLicpO1xuXHRcdHJldHVybiB0aGlzLnRyeUluaXREQigpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyB0cnlJbml0REIoKTogUHJvbWlzZTxTZXF1ZWxpemU+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCF0aGlzLnNlcXVlbGl6ZUluc3RhbmNlKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0YFNlcXVlbGl6ZSBsb2dnaW5nIHNldCB0byAke3RoaXMuZW52Q29uZmlnLmdldEZlYXR1cmVGbGFncygpLnNlcXVlbGl6ZUxvZ2dpbmd9YFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGNvbnN0IGhvc3QgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJIb3N0Jyk7XG5cdFx0XHRcdGNvbnN0IGRpYWxlY3QgPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJEaWFsZWN0Jyk7XG5cblx0XHRcdFx0aWYgKCFob3N0IHx8ICFkaWFsZWN0KSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSBob3N0IG9yIGRpYWxlY3QgaXMgbWlzc2luZy4nKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHNlcXVlbGl6ZU9wdGlvbnM6IE9wdGlvbnMgPSB7XG5cdFx0XHRcdFx0aG9zdCxcblx0XHRcdFx0XHRkaWFsZWN0OiBkaWFsZWN0IGFzIERpYWxlY3QsXG5cdFx0XHRcdFx0bG9nZ2luZzogdGhpcy5lbnZDb25maWcuZ2V0RmVhdHVyZUZsYWdzKCkuc2VxdWVsaXplTG9nZ2luZ1xuXHRcdFx0XHRcdFx0PyAobXNnOiBzdHJpbmcpOiBMb2dnZXIgPT4gdGhpcy5sb2dnZXIuaW5mbyhtc2cpXG5cdFx0XHRcdFx0XHQ6IGZhbHNlXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29uc3QgZGJQYXNzd29yZCA9IHRoaXMudmF1bHQucmV0cmlldmVTZWNyZXQoXG5cdFx0XHRcdFx0J0RCX1BBU1NXT1JEJyxcblx0XHRcdFx0XHRzZWNyZXQgPT4gc2VjcmV0XG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBkYlBhc3N3b3JkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oJ1ZhbGlkIGRhdGFiYXNlIHBhc3N3b3JkIG5vdCBmb3VuZCcpO1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignRGF0YWJhc2UgcGFzc3dvcmQgbm90IGZvdW5kJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLnNlcXVlbGl6ZUluc3RhbmNlID0gbmV3IFNlcXVlbGl6ZShcblx0XHRcdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJOYW1lJykgYXMgc3RyaW5nLFxuXHRcdFx0XHRcdHRoaXMuZW52Q29uZmlnLmdldEVudlZhcmlhYmxlKCdkYlVzZXInKSBhcyBzdHJpbmcsXG5cdFx0XHRcdFx0ZGJQYXNzd29yZCxcblx0XHRcdFx0XHRzZXF1ZWxpemVPcHRpb25zXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0YXdhaXQgdGhpcy5zZXF1ZWxpemVJbnN0YW5jZS5hdXRoZW50aWNhdGUoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0XHQnQ29ubmVjdGlvbiBoYXMgYmVlbiBlc3RhYmxpc2hlZCBzdWNjZXNzZnVsbHkuJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnRGF0YWJhc2UgY29ubmVjdGlvbiBhbHJlYWR5IGluaXRpYWxpemVkLicpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcy5zZXF1ZWxpemVJbnN0YW5jZTtcblx0XHR9IGNhdGNoIChkYkVycm9yOiB1bmtub3duKSB7XG5cdFx0XHR0aGlzLmF0dGVtcHQgKz0gMTtcblx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9XG5cdFx0XHRcdGRiRXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGRiRXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJztcblxuXHRcdFx0aWYgKFxuXHRcdFx0XHR0aGlzLmF0dGVtcHQgPFxuXHRcdFx0XHQodGhpcy5lbnZDb25maWcuZ2V0RW52VmFyaWFibGUoJ2RiSW5pdE1heFJldHJpZXMnKSBhcyBudW1iZXIpXG5cdFx0XHQpIHtcblx0XHRcdFx0Y29uc3QgcmVjb3ZlcmFibGVFcnJvcjogQXBwRXJyb3IgPVxuXHRcdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRcdFx0YERhdGFiYXNlIGNvbm5lY3Rpb24gYXR0ZW1wdCAke3RoaXMuYXR0ZW1wdH0gZmFpbGVkXFxuUmV0cnlpbmcuLi5gLFxuXHRcdFx0XHRcdFx0eyBvcmlnaW5hbEVycm9yOiBkYkVycm9yIH1cblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKHJlY292ZXJhYmxlRXJyb3IubWVzc2FnZSk7XG5cdFx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3I6IHJlY292ZXJhYmxlRXJyb3IgfSk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0YFJldHJ5aW5nIGRhdGFiYXNlIGNvbm5lY3Rpb24gaW4gJHt0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJJbml0UmV0cnlBZnRlcicpfSBzZWNvbmRzLi4uYFxuXHRcdFx0XHQpO1xuXHRcdFx0XHRhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+XG5cdFx0XHRcdFx0c2V0VGltZW91dChcblx0XHRcdFx0XHRcdHJlc29sdmUsXG5cdFx0XHRcdFx0XHR0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZShcblx0XHRcdFx0XHRcdFx0J2RiSW5pdFJldHJ5QWZ0ZXInXG5cdFx0XHRcdFx0XHQpIGFzIG51bWJlclxuXHRcdFx0XHRcdClcblx0XHRcdFx0KTtcblx0XHRcdFx0cmV0dXJuIHRoaXMudHJ5SW5pdERCKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBmYXRhbEVycm9yID1cblx0XHRcdFx0XHRuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JGYXRhbChcblx0XHRcdFx0XHRcdGBGYWlsZWQgdG8gYXV0aGVudGljYXRlIGRhdGFiYXNlIGNvbm5lY3Rpb24gYWZ0ZXIgJHt0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnZGJJbml0TWF4UmV0cmllcycpfSBhdHRlbXB0czogJHtlcnJvck1lc3NhZ2V9YCxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0b3JpZ2luYWxFcnJvcjogZGJFcnJvcixcblx0XHRcdFx0XHRcdFx0ZXhwb3NlVG9DbGllbnQ6IGZhbHNlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihmYXRhbEVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHR0aHJvdyBmYXRhbEVycm9yO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBnZXRFbnRyaWVzPFQ+KE1vZGVsOiBNb2RlbE9wZXJhdGlvbnM8VD4pOiBQcm9taXNlPFRbXT4ge1xuXHRcdGNvbnN0IGNhY2hlS2V5ID0gYGVudHJpZXNfJHtNb2RlbC5uYW1lfWA7XG5cdFx0Y29uc3QgY2FjaGVFeHBpcmF0aW9uID0gNjAgKiA1O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGNhY2hlZERhdGEgPSBhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5nZXQ8VFtdPihcblx0XHRcdFx0Y2FjaGVLZXksXG5cdFx0XHRcdCdEYXRhYmFzZUNvbnRyb2xsZXInXG5cdFx0XHQpO1xuXHRcdFx0aWYgKGNhY2hlZERhdGEpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgQ2FjaGUgaGl0IGZvciBlbnRyaWVzIGluICR7TW9kZWwubmFtZX1gKTtcblx0XHRcdFx0cmV0dXJuIGNhY2hlZERhdGE7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdGBDYWNoZSBtaXNzIGZvciBlbnRyaWVzIGluICR7TW9kZWwubmFtZX0sIHF1ZXJ5aW5nIGRhdGFiYXNlYFxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgZW50cmllcyA9IGF3YWl0IE1vZGVsLmZpbmRBbGwoKTtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLnNldChcblx0XHRcdFx0Y2FjaGVLZXksXG5cdFx0XHRcdGVudHJpZXMsXG5cdFx0XHRcdCdEYXRhYmFzZUNvbnRyb2xsZXInLFxuXHRcdFx0XHRjYWNoZUV4cGlyYXRpb25cblx0XHRcdCk7XG5cblx0XHRcdHJldHVybiBlbnRyaWVzO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgZmV0Y2hpbmcgZW50cmllcyBmcm9tICR7TW9kZWwubmFtZX06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5oYW5kbGVEQkVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnR0VUX0VOVFJJRVNfRkFJTEVEJyxcblx0XHRcdFx0eyBtb2RlbDogTW9kZWwubmFtZSB9LFxuXHRcdFx0XHRgRXJyb3IgZmV0Y2hpbmcgZW50cmllcyBmcm9tICR7TW9kZWwubmFtZX1gXG5cdFx0XHQpO1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBjcmVhdGVFbnRyeTxUPihcblx0XHRNb2RlbDogTW9kZWxPcGVyYXRpb25zPFQ+LFxuXHRcdGRhdGE6IFRcblx0KTogUHJvbWlzZTxUPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG5ld0VudHJ5ID0gYXdhaXQgTW9kZWwuY3JlYXRlKGRhdGEpO1xuXHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYENyZWF0ZWQgbmV3IGVudHJ5IGluICR7TW9kZWwubmFtZX1gKTtcblxuXHRcdFx0YXdhaXQgdGhpcy5jbGVhckNhY2hlKGBlbnRyaWVzXyR7TW9kZWwubmFtZX1gKTtcblxuXHRcdFx0cmV0dXJuIG5ld0VudHJ5O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgY3JlYXRpbmcgZW50cnkgaW4gJHtNb2RlbC5uYW1lfTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmhhbmRsZURCRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0ZXJyb3IsXG5cdFx0XHRcdCdDUkVBVEVfRU5UUllfRkFJTEVEJyxcblx0XHRcdFx0eyBtb2RlbDogTW9kZWwubmFtZSB9LFxuXHRcdFx0XHRgRXJyb3IgY3JlYXRpbmcgZW50cnkgaW4gJHtNb2RlbC5uYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4ge30gYXMgVDtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZGVsZXRlRW50cnk8VD4oXG5cdFx0TW9kZWw6IE1vZGVsT3BlcmF0aW9uczxUPixcblx0XHRpZDogbnVtYmVyXG5cdCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBkZWxldGVkID0gYXdhaXQgTW9kZWwuZGVzdHJveSh7IHdoZXJlOiB7IGlkIH0gfSk7XG5cdFx0XHRpZiAoIWRlbGV0ZWQpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoXG5cdFx0XHRcdFx0YCR7TW9kZWwubmFtZX0gZW50cnkgd2l0aCBpZCAke2lkfSBub3QgZm91bmRgXG5cdFx0XHRcdCk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgRGVsZXRlZCAke01vZGVsLm5hbWV9IGVudHJ5IHdpdGggaWQgJHtpZH1gKTtcblx0XHRcdGF3YWl0IHRoaXMuY2xlYXJDYWNoZShgZW50cmllc18ke01vZGVsLm5hbWV9YCk7XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgZGVsZXRpbmcgZW50cnkgZnJvbSAke01vZGVsLm5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IGRiRGVsZXRlRW50cnlFcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRcdGBEQiBFbnRyeSBEZWxldGlvbjogRXJyb3IgZGVsZXRpbmcgZW50cnkgZnJvbSAke01vZGVsLm5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YCxcblx0XHRcdFx0XHR7IG9yaWdpbmFsRXJyb3I6IGVycm9yLCBleHBvc2VUb0NsaWVudDogZmFsc2UgfVxuXHRcdFx0XHQpO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0XHRlcnJvcjogZGJEZWxldGVFbnRyeUVycm9yLFxuXHRcdFx0XHRkZXRhaWxzOiB7IGFjdGlvbjogJ2RlbGV0ZUVudHJ5JywgbW9kZWw6IE1vZGVsLm5hbWUsIGlkIH1cblx0XHRcdH0pO1xuXHRcdFx0dGhyb3cgbmV3IEFwcEVycm9yKCdDb3VsZCBub3QgZGVsZXRlIGVudHJ5JywgNTAwKTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgY2xlYXJJZGxlQ29ubmVjdGlvbnMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGlmICh0aGlzLnNlcXVlbGl6ZUluc3RhbmNlKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0J0NoZWNraW5nIGZvciBpZGxlIGRhdGFiYXNlIGNvbm5lY3Rpb25zIHRvIGNsb3NlJ1xuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGF3YWl0IHRoaXMuc2VxdWVsaXplSW5zdGFuY2UuY2xvc2UoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQWxsIGRhdGFiYXNlIGNvbm5lY3Rpb25zIGhhdmUgYmVlbiBjbG9zZWQnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0J05vIFNlcXVlbGl6ZSBpbnN0YW5jZSBhdmFpbGFibGUgdG8gY2xvc2UgY29ubmVjdGlvbnMnXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBFcnJvciBjbG9zaW5nIGRhdGFiYXNlIGNvbm5lY3Rpb25zOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IGNsZWFyREJEQ29ubmVjdGlvbnNFcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRcdGBFcnJvciBjbG9zaW5nIGRhdGFiYXNlIGNvbm5lY3Rpb25zOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YCxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRvcmlnaW5hbEVycm9yOiBlcnJvcixcblx0XHRcdFx0XHRcdGV4cG9zZVRvQ2xpZW50OiBmYWxzZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3I6IGNsZWFyREJEQ29ubmVjdGlvbnNFcnJvciB9KTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgY2FjaGVEYXRhPFQ+KFxuXHRcdGtleTogc3RyaW5nLFxuXHRcdGRhdGE6IFQsXG5cdFx0ZXhwaXJhdGlvbj86IG51bWJlclxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxvZ2dlci5pbmZvKGBDYWNoaW5nIGRhdGEgd2l0aCBrZXk6ICR7a2V5fWApO1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQ8VD4oXG5cdFx0XHRcdGtleSxcblx0XHRcdFx0ZGF0YSxcblx0XHRcdFx0J0RhdGFiYXNlQ29udHJvbGxlcicsXG5cdFx0XHRcdGV4cGlyYXRpb25cblx0XHRcdCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBFcnJvciBjYWNoaW5nIGRhdGEgd2l0aCBrZXkgJHtrZXl9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlREJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0NBQ0hJTkdfREFUQV9GQUlMRUQnLFxuXHRcdFx0XHR7IGtleSB9LFxuXHRcdFx0XHRgRXJyb3IgY2FjaGluZyBkYXRhIHdpdGgga2V5ICR7a2V5fWBcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIHF1ZXJ5V2l0aENhY2hlPFQgZXh0ZW5kcyBvYmplY3Q+KFxuXHRcdHF1ZXJ5OiBzdHJpbmcsXG5cdFx0Y2FjaGVLZXk6IHN0cmluZyxcblx0XHRleHBpcmF0aW9uPzogbnVtYmVyXG5cdCk6IFByb21pc2U8VCB8IG51bGw+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc2VydmljZSA9ICdEYXRhYmFzZUNvbnRyb2xsZXInO1xuXHRcdFx0Y29uc3QgY2FjaGVkRGF0YSA9IHRoaXMuY2FjaGVTZXJ2aWNlLmdldChjYWNoZUtleSwgc2VydmljZSk7XG5cdFx0XHRpZiAoY2FjaGVkRGF0YSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBDYWNoZSBoaXQgZm9yIGtleTogJHtjYWNoZUtleX1gKTtcblx0XHRcdFx0cmV0dXJuIGNhY2hlZERhdGEgYXMgVDtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0YENhY2hlIG1pc3MgZm9yIGtleTogJHtjYWNoZUtleX0sIHF1ZXJ5aW5nIGRhdGFiYXNlYFxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zZXF1ZWxpemVJbnN0YW5jZT8ucXVlcnk8VD4ocXVlcnksIHtcblx0XHRcdFx0dHlwZTogUXVlcnlUeXBlcy5TRUxFQ1Rcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAocmVzdWx0KSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0YFN0b3JpbmcgcmVzdWx0IGluIGNhY2hlIHdpdGgga2V5OiAke2NhY2hlS2V5fWBcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRpZiAoZXhwaXJhdGlvbikge1xuXHRcdFx0XHRcdGNvbnN0IGV4cGlyYXRpb25TdHIgPSBgJHtleHBpcmF0aW9ufWA7XG5cdFx0XHRcdFx0dGhpcy5jYWNoZVNlcnZpY2Uuc2V0KGNhY2hlS2V5LCByZXN1bHQsIGV4cGlyYXRpb25TdHIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuY2FjaGVTZXJ2aWNlLnNldChjYWNoZUtleSwgcmVzdWx0LCBzZXJ2aWNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0ID8gKHJlc3VsdCBhcyBUKSA6IG51bGw7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBFcnJvciBxdWVyeWluZyBkYXRhYmFzZSB3aXRoIGNhY2hlOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlREJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J1FVRVJZX1dJVEhfQ0FDSEVfRkFJTEVEJyxcblx0XHRcdFx0eyBxdWVyeSwgY2FjaGVLZXkgfSxcblx0XHRcdFx0YEVycm9yIHF1ZXJ5aW5nIGRhdGFiYXNlIHdpdGggY2FjaGU6ICR7ZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBnZXRDYWNoZWREYXRhPFQ+KGtleTogc3RyaW5nKTogUHJvbWlzZTxUIHwgbnVsbD4ge1xuXHRcdHRoaXMubG9nZ2VyLmluZm8oYEZldGNoaW5nIGRhdGEgZnJvbSBDYWNoZVNlcnZpY2Ugd2l0aCBrZXk6ICR7a2V5fWApO1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzZXJ2aWNlID0gJ0RhdGFiYXNlQ29udHJvbGxlcic7XG5cdFx0XHRyZXR1cm4gdGhpcy5jYWNoZVNlcnZpY2UuZ2V0PFQ+KGtleSwgc2VydmljZSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBFcnJvciBmZXRjaGluZyBkYXRhIGZyb20gQ2FjaGVTZXJ2aWNlIHdpdGgga2V5ICR7a2V5fTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yfWBcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBjYWNoZUVycm9yID1cblx0XHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5EYXRhYmFzZUVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdFx0YEVycm9yIGZldGNoaW5nIGRhdGEgZnJvbSBDYWNoZVNlcnZpY2Ugd2l0aCBrZXkgJHtrZXl9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YCxcblx0XHRcdFx0XHR7IG9yaWdpbmFsRXJyb3I6IGVycm9yLCBleHBvc2VUb0NsaWVudDogZmFsc2UgfVxuXHRcdFx0XHQpO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoeyBlcnJvcjogY2FjaGVFcnJvciB9KTtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBjbGVhckNhY2hlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbyhgQ2xlYXJpbmcgY2FjaGUgZm9yIGtleTogJHtrZXl9YCk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLmRlbChrZXksICdEYXRhYmFzZUNvbnRyb2xsZXInKTtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oYENhY2hlIGNsZWFyZWQgc3VjY2Vzc2Z1bGx5IGZvciBrZXk6ICR7a2V5fWApO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgY2xlYXJpbmcgY2FjaGUgZm9yIGtleSAke2tleX06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5oYW5kbGVEQkVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnQ0xFQVJfQ0FDSEVfRkFJTEVEJyxcblx0XHRcdFx0eyBrZXkgfSxcblx0XHRcdFx0YEVycm9yIGNsZWFyaW5nIGNhY2hlIGZvciBrZXkgJHtrZXl9YFxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2V0RGF0YWJhc2VJbmZvKCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcblx0XHRjb25zdCBjYWNoZUtleSA9ICdkYkluZm8nO1xuXHRcdGNvbnN0IGNhY2hlRXhwaXJhdGlvbiA9IDMwO1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBjYWNoZWREYXRhID1cblx0XHRcdFx0YXdhaXQgdGhpcy5nZXRDYWNoZWREYXRhPFJlY29yZDxzdHJpbmcsIHVua25vd24+PihjYWNoZUtleSk7XG5cdFx0XHRpZiAoY2FjaGVkRGF0YSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBDYWNoZSBoaXQgZm9yIGRhdGFiYXNlIGluZm9gKTtcblx0XHRcdFx0cmV0dXJuIGNhY2hlZERhdGE7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdGBDYWNoZSBtaXNzIGZvciBkYXRhYmFzZSBpbmZvLCBxdWVyeWluZyB0aGUgZGF0YWJhc2UuLi5gXG5cdFx0XHQpO1xuXG5cdFx0XHRjb25zdCB1cHRpbWVSZXN1bHQgPSAoYXdhaXQgdGhpcy5zZXF1ZWxpemVJbnN0YW5jZT8ucXVlcnkoXG5cdFx0XHRcdCdTRUxFQ1QgRVhUUkFDVChFUE9DSCBGUk9NIGN1cnJlbnRfdGltZXN0YW1wIC0gcGdfcG9zdG1hc3Rlcl9zdGFydF90aW1lKCkpIEFTIHVwdGltZV9pbl9zZWNvbmRzJyxcblx0XHRcdFx0eyB0eXBlOiBRdWVyeVR5cGVzLlNFTEVDVCB9XG5cdFx0XHQpKSBhcyBbeyB1cHRpbWVfaW5fc2Vjb25kczogbnVtYmVyIH1dO1xuXHRcdFx0Y29uc3QgY29ubmVjdGVkQ2xpZW50c1Jlc3VsdCA9IChhd2FpdCB0aGlzLnNlcXVlbGl6ZUluc3RhbmNlPy5xdWVyeShcblx0XHRcdFx0J1NFTEVDVCBDT1VOVCgqKSBBUyBjb25uZWN0ZWRfY2xpZW50cyBGUk9NIHBnX3N0YXRfYWN0aXZpdHknLFxuXHRcdFx0XHR7IHR5cGU6IFF1ZXJ5VHlwZXMuU0VMRUNUIH1cblx0XHRcdCkpIGFzIFt7IGNvbm5lY3RlZF9jbGllbnRzOiBudW1iZXIgfV07XG5cdFx0XHRjb25zdCBtZW1vcnlVc2FnZVJlc3VsdCA9IChhd2FpdCB0aGlzLnNlcXVlbGl6ZUluc3RhbmNlPy5xdWVyeShcblx0XHRcdFx0J1NFTEVDVCBwZ19kYXRhYmFzZV9zaXplKGN1cnJlbnRfZGF0YWJhc2UoKSkgQVMgdXNlZF9tZW1vcnknLFxuXHRcdFx0XHR7IHR5cGU6IFF1ZXJ5VHlwZXMuU0VMRUNUIH1cblx0XHRcdCkpIGFzIFt7IHVzZWRfbWVtb3J5OiBudW1iZXIgfV07XG5cdFx0XHRjb25zdCBjcHVVc2FnZVJlc3VsdCA9IChhd2FpdCB0aGlzLnNlcXVlbGl6ZUluc3RhbmNlPy5xdWVyeShcblx0XHRcdFx0J1NFTEVDVCBzdW0odG90YWxfdGltZSkgYXMgdXNlZF9jcHVfc3lzIEZST00gcGdfc3RhdF9zdGF0ZW1lbnRzJyxcblx0XHRcdFx0eyB0eXBlOiBRdWVyeVR5cGVzLlNFTEVDVCB9XG5cdFx0XHQpKSBhcyBbeyB1c2VkX2NwdV9zeXM6IG51bWJlciB9XTtcblxuXHRcdFx0Y29uc3QgdXB0aW1lSW5TZWNvbmRzID0gdXB0aW1lUmVzdWx0Py5bMF0/LnVwdGltZV9pbl9zZWNvbmRzIHx8IDA7XG5cdFx0XHRjb25zdCBjb25uZWN0ZWRDbGllbnRzID1cblx0XHRcdFx0Y29ubmVjdGVkQ2xpZW50c1Jlc3VsdD8uWzBdPy5jb25uZWN0ZWRfY2xpZW50cyB8fCAwO1xuXHRcdFx0Y29uc3QgdXNlZE1lbW9yeSA9IG1lbW9yeVVzYWdlUmVzdWx0Py5bMF0/LnVzZWRfbWVtb3J5IHx8IDA7XG5cdFx0XHRjb25zdCB1c2VkQ3B1U3lzID0gY3B1VXNhZ2VSZXN1bHQ/LlswXT8udXNlZF9jcHVfc3lzIHx8IDA7XG5cblx0XHRcdGNvbnN0IGRiSW5mbyA9IHtcblx0XHRcdFx0dXB0aW1lX2luX3NlY29uZHM6IHVwdGltZUluU2Vjb25kcyxcblx0XHRcdFx0Y29ubmVjdGVkX2NsaWVudHM6IGNvbm5lY3RlZENsaWVudHMsXG5cdFx0XHRcdHVzZWRfbWVtb3J5OiB1c2VkTWVtb3J5LFxuXHRcdFx0XHR1c2VkX2NwdV9zeXM6IHVzZWRDcHVTeXNcblx0XHRcdH07XG5cblx0XHRcdGF3YWl0IHRoaXMuY2FjaGVEYXRhKGNhY2hlS2V5LCBkYkluZm8sIGNhY2hlRXhwaXJhdGlvbik7XG5cblx0XHRcdHJldHVybiBkYkluZm87XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdGBFcnJvciBmZXRjaGluZyBkYXRhYmFzZSBpbmZvOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IGRiSW5mb0Vycm9yID1cblx0XHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5EYXRhYmFzZUVycm9yUmVjb3ZlcmFibGUoXG5cdFx0XHRcdFx0J0RhdGFiYXNlIGluZm8gcmV0cmlldmFsIGZhaWxlZCcsXG5cdFx0XHRcdFx0eyBvcmlnaW5hbEVycm9yOiBlcnJvciwgZXhwb3NlVG9DbGllbnQ6IGZhbHNlIH1cblx0XHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlREJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRkYkluZm9FcnJvcixcblx0XHRcdFx0J0RCX0lORk9fUkVUUklFVkFMX0ZBSUxFRCcsXG5cdFx0XHRcdHt9LFxuXHRcdFx0XHQnRGF0YWJhc2UgaW5mbyByZXRyaWV2YWwgZmFpbGVkJ1xuXHRcdFx0KTtcblx0XHRcdHJldHVybiB7fTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2V0RGF0YWJhc2VNZXRyaWNzKFxuXHRcdHNlcnZpY2VOYW1lOiBzdHJpbmdcblx0KTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBkYXRhYmFzZUluZm8gPSBhd2FpdCB0aGlzLmdldERhdGFiYXNlSW5mbygpO1xuXG5cdFx0XHRjb25zdCBkYXRhYmFzZU1ldHJpY3M6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuXHRcdFx0XHRzZXJ2aWNlOiBzZXJ2aWNlTmFtZSxcblx0XHRcdFx0c3RhdHVzOiBkYXRhYmFzZUluZm8gPyAnQ29ubmVjdGVkJyA6ICdOb3QgY29ubmVjdGVkJyxcblx0XHRcdFx0dXB0aW1lX2luX3NlY29uZHM6IGRhdGFiYXNlSW5mby51cHRpbWVfaW5fc2Vjb25kcyA/PyAwLFxuXHRcdFx0XHRjcHVfdXNlZDogZGF0YWJhc2VJbmZvLnVzZWRfY3B1X3N5cyA/PyAwLFxuXHRcdFx0XHRtZW1vcnlfdXNlZDogZGF0YWJhc2VJbmZvLnVzZWRfbWVtb3J5ID8/IDAsXG5cdFx0XHRcdGNvbm5lY3RlZF9jbGllbnRzOiBkYXRhYmFzZUluZm8uY29ubmVjdGVkX2NsaWVudHMgPz8gMCxcblx0XHRcdFx0Y2FjaGVfc2l6ZTogZGF0YWJhc2VJbmZvLmNhY2hlU2l6ZSA/PyAwLFxuXHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhcblx0XHRcdFx0YERhdGFiYXNlIG1ldHJpY3MgZm9yICR7c2VydmljZU5hbWV9OiAke0pTT04uc3RyaW5naWZ5KGRhdGFiYXNlTWV0cmljcyl9YFxuXHRcdFx0KTtcblxuXHRcdFx0cmV0dXJuIGRhdGFiYXNlTWV0cmljcztcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIGZldGNoaW5nIGRhdGFiYXNlIG1ldHJpY3MgZm9yICR7c2VydmljZU5hbWV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuaGFuZGxlREJFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0RCX01FVFJJQ1NfUkVUUklFVkFMX0VSUk9SJyxcblx0XHRcdFx0eyBzZXJ2aWNlTmFtZSB9LFxuXHRcdFx0XHRgRXJyb3IgcmV0cmlldmluZyBkYXRhYmFzZSBtZXRyaWNzIGZvciAke3NlcnZpY2VOYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzZXJ2aWNlOiBzZXJ2aWNlTmFtZSxcblx0XHRcdFx0c3RhdHVzOiAnRXJyb3IgcmV0cmlldmluZyBtZXRyaWNzJ1xuXHRcdFx0fTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgc2h1dGRvd24oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBkYXRhYmFzZSBjb250cm9sbGVyLi4uJyk7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuY2xlYXJJZGxlQ29ubmVjdGlvbnMoKTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQ2xlYXJpbmcgZGF0YWJhc2UgY2FjaGUuLi4nKTtcblxuXHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2UuY2xlYXJOYW1lc3BhY2UoJ0RhdGFiYXNlQ29udHJvbGxlcicpO1xuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdEYXRhYmFzZSBjYWNoZSBjbGVhcmVkLicpO1xuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdBZGRpdGlvbmFsIGNsZWFudXAgY29tcGxldGVkLicpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRmFpbGVkIHRvIHNodXQgZG93biBkYXRhYmFzZSBjb250cm9sbGVyOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0RGF0YWJhc2VDb250cm9sbGVyLmluc3RhbmNlID0gbnVsbDtcblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ0RhdGFiYXNlQ29udHJvbGxlciBpbnN0YW5jZSBoYXMgYmVlbiBudWxsaWZpZWQuJyk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVEQkVycm9yUmVjb3ZlcmFibGUoXG5cdFx0ZXJyb3I6IHVua25vd24sXG5cdFx0ZXJyb3JIZWFkZXI6IHN0cmluZyxcblx0XHRlcnJvckRldGFpbHM6IG9iamVjdCxcblx0XHRjdXN0b21NZXNzYWdlOiBzdHJpbmdcblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGAke2N1c3RvbU1lc3NhZ2V9OiAke2Vycm9yfVxcbiR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLnN0YWNrIDogJyd9YDtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoZXJyb3JNZXNzYWdlKTtcblxuXHRcdFx0Y29uc3QgcmVzb3VyY2VFcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRcdGVycm9ySGVhZGVyLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRldGFpbHM6IGVycm9yRGV0YWlscyxcblx0XHRcdFx0XHRcdGV4cG9zZVRvQ2xpZW50OiBmYWxzZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblxuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0XHRlcnJvcjogcmVzb3VyY2VFcnJvclxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgRXJyb3IgaGFuZGxpbmcgcmVzb3VyY2UgbWFuYWdlciBlcnJvcjogJHtlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0Y29uc3Qgc2V2ZXJpdHkgPSB0aGlzLmVycm9ySGFuZGxlci5FcnJvclNldmVyaXR5LldBUk5JTkc7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7XG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRkZXRhaWxzOiB7XG5cdFx0XHRcdFx0Y29udGV4dDogJ0RhdGFiYXNlIENvbnRyb2xsZXInLFxuXHRcdFx0XHRcdGFjdGlvbjogJ1Bhc3NpbmcgZXJyb3IgZnJvbSBEYXRhYmFzZSBDb250cm9sbGVyIGVycm9yIGhhbmRsZXIgdG8gRXJyb3JIYW5kbGVyU2VydmljZScsXG5cdFx0XHRcdFx0bm90ZXM6ICdFcnJvciBvY2N1cnJlZCB3aGlsZSBoYW5kbGluZyBEYXRhYmFzZSBDb250cm9sbGVyIGVycm9yOiBEYXRhYmFzZUNvbnRyb2xsZXIuaGFuZGxlREJFcnJvclJlY292ZXJhYmxlJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRzZXZlcml0eVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVEQkVycm9yRmF0YWwoXG5cdFx0ZXJyb3I6IHVua25vd24sXG5cdFx0ZXJyb3JIZWFkZXI6IHN0cmluZyxcblx0XHRlcnJvckRldGFpbHM6IG9iamVjdCxcblx0XHRjdXN0b21NZXNzYWdlOiBzdHJpbmdcblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGAke2N1c3RvbU1lc3NhZ2V9OiAke2Vycm9yfVxcbiR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLnN0YWNrIDogJyd9YDtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoZXJyb3JNZXNzYWdlKTtcblxuXHRcdFx0Y29uc3QgcmVzb3VyY2VFcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvckZhdGFsKFxuXHRcdFx0XHRcdGVycm9ySGVhZGVyLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRldGFpbHM6IGVycm9yRGV0YWlscyxcblx0XHRcdFx0XHRcdGV4cG9zZVRvQ2xpZW50OiBmYWxzZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblxuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0XHRlcnJvcjogcmVzb3VyY2VFcnJvclxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgRXJyb3IgaGFuZGxpbmcgcmVzb3VyY2UgbWFuYWdlciBlcnJvcjogJHtlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0Y29uc3Qgc2V2ZXJpdHkgPSB0aGlzLmVycm9ySGFuZGxlci5FcnJvclNldmVyaXR5LldBUk5JTkc7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7XG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRkZXRhaWxzOiB7XG5cdFx0XHRcdFx0Y29udGV4dDogJ0RhdGFiYXNlIENvbnRyb2xsZXInLFxuXHRcdFx0XHRcdGFjdGlvbjogJ1Bhc3NpbmcgZXJyb3IgZnJvbSBEYXRhYmFzZSBDb250cm9sbGVyIGVycm9yIGhhbmRsZXIgdG8gRXJyb3JIYW5kbGVyU2VydmljZScsXG5cdFx0XHRcdFx0bm90ZXM6ICdFcnJvciBvY2N1cnJlZCB3aGlsZSBoYW5kbGluZyBEYXRhYmFzZSBDb250cm9sbGVyIGVycm9yOiBEYXRhYmFzZUNvbnRyb2xsZXIuaGFuZGxlREJFcnJvckZhdGFsJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRzZXZlcml0eVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59XG4iXX0=
