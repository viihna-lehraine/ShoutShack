import { Strategy as LocalStrategy } from 'passport-local';
import {
	ExtractJwt,
	Strategy as JwtStrategy,
	StrategyOptions,
	VerifiedCallback
} from 'passport-jwt';
import {
	AppLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	PassportServiceInterface,
	PasswordServiceInterface,
	VaultServiceInterface
} from '../index/interfaces/main';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { AuthServiceFactory } from '../index/factory/subfactories/AuthServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';
import { VaultServiceFactory } from '../index/factory/subfactories/VaultServiceFactory';

export class PassportService implements PassportServiceInterface {
	private static instance: PassportService | null = null;

	private passwordService: PasswordServiceInterface;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private vault: VaultServiceInterface;

	private constructor(
		passwordService: PasswordServiceInterface,
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		secrets: VaultServiceInterface
	) {
		this.passwordService = passwordService;
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.vault = secrets;
	}

	public static async getInstance(): Promise<PassportService> {
		if (!PassportService.instance) {
			const passwordService =
				await AuthServiceFactory.getPasswordService();
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const vault = await VaultServiceFactory.getVaultService();

			PassportService.instance = new PassportService(
				passwordService,
				logger,
				errorLogger,
				errorHandler,
				vault
			);
		}

		return PassportService.instance;
	}

	public async configurePassport(
		passport: import('passport').PassportStatic,
		UserModel: typeof import('../models/User').User
	): Promise<void> {
		try {
			const jwtSecret = this.vault.retrieveSecret(
				'JWT_SECRET',
				secret => secret
			);

			if (typeof jwtSecret !== 'string') {
				const jwtSecretError =
					new this.errorHandler.ErrorClasses.ConfigurationError(
						'Invalid JWT secret'
					);
				this.errorLogger.logError(jwtSecretError.message);
				this.errorHandler.handleError({ error: jwtSecretError });
				throw jwtSecretError;
			}

			const opts: StrategyOptions = {
				jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
				secretOrKey: jwtSecret
			};

			passport.use(
				new JwtStrategy(
					opts,
					async (jwtPayload, done: VerifiedCallback) => {
						try {
							const user = await UserModel.findByPk(
								jwtPayload.id
							);

							if (user) {
								this.logger.info(
									`JWT authentication successful for user: ${user.username}`
								);
								return done(null, user);
							} else {
								this.logger.warn(
									'JWT authentication failed: User not found'
								);
								return done(null, false, {
									message: 'User not found'
								});
							}
						} catch (error) {
							this.handlePassportAuthServiceError(
								error,
								'JWT authentication failed',
								{ jwtPayload },
								'JWT authentication failed'
							);
						}
					}
				)
			);

			passport.use(
				new LocalStrategy(async (username, password, done) => {
					try {
						const user = await UserModel.findOne({
							where: { username }
						});

						if (!user) {
							this.logger.warn(
								`Local authentication failed: User not found: ${username}`
							);
							return done(null, false, {
								message: 'User not found'
							});
						}

						const pepper = this.vault.retrieveSecret(
							'PEPPER',
							secret => secret
						);

						if (typeof pepper !== 'string') {
							this.logger.error(
								'Failed to retrieve valid PEPPER secret'
							);
							throw new Error('Invalid PEPPER secret');
						}

						const passwordService =
							await AuthServiceFactory.getPasswordService();
						const isMatch = await passwordService.comparePassword(
							user.password,
							password,
							pepper
						);

						if (isMatch) {
							this.logger.info(
								`Local authentication successful for user: ${username}`
							);
							return done(null, user);
						} else {
							this.logger.warn(
								`Local authentication failed: Incorrect password for user: ${username}`
							);
							return done(null, false, {
								message: 'Incorrect password'
							});
						}
					} catch (error) {
						this.handlePassportAuthServiceError(
							error,
							'Local authentication failed',
							{ username, password },
							'Local authentication failed'
						);
					}
				})
			);

			this.logger.info('Passport configured successfully');
		} catch (error) {
			this.errorLogger.logError('Failed to configure Passport');
			this.handlePassportAuthServiceError(
				error,
				'Passport configuration failed',
				{ error },
				'Failed to configure Passport'
			);
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down PassportService...');
			this.logger.info(
				'Clearing PassportService cache or handlers (if any)...'
			);

			PassportService.instance = null;

			this.logger.info(
				'PassportService shutdown completed successfully.'
			);
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during PassportService shutdown: ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}

	private handlePassportAuthServiceError(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
		try {
			const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
			this.errorLogger.logError(errorMessage);

			const resourceError =
				new this.errorHandler.ErrorClasses.PassportAuthServiceError(
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
				`Error handling Passport Auth Service error: ${error}`
			);
			const severity = this.errorHandler.ErrorSeverity.WARNING;
			this.errorHandler.handleError({
				error,
				details: {
					context: 'Passport Auth Service',
					action: 'Passing error from Passport Auth Service handler to ErrorHandlerService',
					notes: 'Error occurred while handling Auth Controller error: PassportAuthService.handlePassportAuthServiceError'
				},
				severity
			});
		}
	}
}
