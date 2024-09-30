import { Strategy as LocalStrategy } from 'passport-local';
import {
	ExtractJwt,
	Strategy as JwtStrategy,
	StrategyOptions,
	VerifiedCallback
} from 'passport-jwt';
import {
	PassportAuthServiceInterface,
	PassportAuthServiceDeps
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';

export class PassportAuthService implements PassportAuthServiceInterface {
	private static instance: PassportAuthService | null = null;
	private PasswordService = ServiceFactory.getPasswordService();
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private secrets = ServiceFactory.getSecretsStore();

	private constructor() {}

	public static getInstance(): PassportAuthService {
		if (!PassportAuthService.instance) {
			PassportAuthService.instance = new PassportAuthService();
		}
		return PassportAuthService.instance;
	}

	public async configurePassport({
		passport,
		UserModel
	}: PassportAuthServiceDeps): Promise<void> {
		try {
			const jwtSecret = await this.getJwtSecret();

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

						const pepper = this.secrets.retrieveSecrets('PEPPER');

						if (typeof pepper !== 'string') {
							this.logger.error(
								'Failed to retrieve valid PEPPER secret'
							);
							throw new Error('Invalid PEPPER secret');
						}

						const isMatch =
							await this.PasswordService.comparePassword(
								user.password,
								password
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

	private async getJwtSecret(): Promise<string> {
		const secretResult = this.secrets.retrieveSecrets('JWT_SECRET');

		if (typeof secretResult === 'string') {
			return secretResult;
		} else if (
			secretResult &&
			typeof secretResult === 'object' &&
			secretResult.JWT_SECRET
		) {
			return secretResult.JWT_SECRET;
		} else {
			this.logger.error('JWT_SECRET is not available.');
			throw new Error('JWT_SECRET is not available.');
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
