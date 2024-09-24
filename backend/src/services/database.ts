import { Options, Sequelize } from 'sequelize';
import { AppError } from '../errors/errorClasses';
import { configService } from './configService';
import { envSecretsStore } from '../environment/envSecrets';
import { errorHandler } from './errorHandler';

export class DatabaseService {
	private static instance: DatabaseService;
	private sequelizeInstance: Sequelize | null = null;
	private pool: Record<string, unknown> = {};
	private attempt = 0;
	private configService = configService;
	private envSecretsStore = envSecretsStore;
	private logger = configService.getAppLogger();
	private errorLogger = configService.getErrorLogger();
	private errorHandler = errorHandler;

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
			this.logger.logDebug('Database connection initialized');
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

				const sequelizeOptions: Options = {
					host: this.configService.getEnvVariables.dbHost,
					dialect: this.configService.getEnvVariables().dbDialect,
					logging: this.configService.getFeatureFlags()
						.sequelizeLogging
						? (msg: string) => this.logger.info(msg)
						: false
				};

				const dbPassword = this.envSecretsStore.retrieveSecret(
					'dbPassword',
					this.logger
				);

				this.sequelizeInstance = new Sequelize(
					this.configService.getEnvVariables().dbName,
					this.configService.getEnvVariables().dbUser,
					dbPassword!,
					sequelizeOptions
				);

				await this.sequelizeInstance.authenticate();
				this.logger.info(
					'Connection has been established successfully.'
				);
			} else {
				this.logger.info('Database connection already initialized.');
				return this.sequelizeInstance;
			}

			return this.sequelizeInstance;
		} catch (dbError: unknown) {
			this.attempt += 1;
			const errorMessage =
				dbError instanceof Error ? dbError.message : 'Unknown error';

			if (
				this.attempt <
				this.configService.getEnvVariables().dbInitMaxRetries
			) {
				const recoverableError: AppError =
					new this.errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Database connection attempt ${this.attempt} failed\nRetrying...`,
						{ originalError: dbError }
					);
				this.errorLogger.logError(recoverableError.message);
				this.errorHandler.handleError({ error: recoverableError });
				this.logger.warn(
					`Retrying database connection in ${this.configService.getEnvVariables().dbInitRetryAfter / 1000} seconds...`
				);
				await new Promise(resolve =>
					setTimeout(
						resolve,
						this.configService.getEnvVariables().dbInitRetryAfter
					)
				);
				return this.tryInitDB();
			} else {
				const fatalError =
					new this.errorHandler.ErrorClasses.DatabaseErrorFatal(
						`Failed to authenticate database connection after ${this.configService.getEnvVariables().dbInitMaxRetries} attempts: ${errorMessage}`,
						{ originalError: dbError }
					);
				this.configService
					.getErrorLogger()
					.logError(fatalError.message);
				throw fatalError;
			}
		} finally {
			this.envSecretsStore.reEncryptSecret('DB_PASSWORD'!);
			this.logger.debug('Database password re-encrypted.');
		}
	}

	public getInstance(): Sequelize | null {
		return this.sequelizeInstance;
	}
}
