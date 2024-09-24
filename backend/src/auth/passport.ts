import { Strategy as LocalStrategy } from 'passport-local';
import {
	ExtractJwt,
	Strategy as JwtStrategy,
	StrategyOptions,
	VerifiedCallback
} from 'passport-jwt';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';
import { PassportServiceInterface } from '../index/interfaces';
import { envSecretsStore } from '../environment/envSecrets';

export async function configurePassport({
	passport,
	UserModel,
	argon2
}: PassportServiceInterface): Promise<void> {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	try {
		validateDependencies(
			[
				{ name: 'passport', instance: passport },
				{ name: 'UserModel', instance: UserModel },
				{ name: 'argon2', instance: argon2 }
			],
			logger
		);

		const opts: StrategyOptions = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: envSecretsStore.retrieveSecret('JWT_SECRET', logger)!
		};

		passport.use(
			new JwtStrategy(
				opts,
				async (jwtPayload, done: VerifiedCallback) => {
					try {
						validateDependencies(
							[
								{ name: 'jwtPayload', instance: jwtPayload },
								{ name: 'jwtPayload', instance: jwtPayload },
								{ name: 'done', instance: done }
							],
							logger
						);

						const user = await UserModel.findByPk(jwtPayload.id);

						if (user) {
							logger.info(
								`JWT authentication successful for user: ${user.username}`
							);
							return done(null, user);
						} else {
							logger.warn(
								'JWT authentication failed: User not found'
							);
							return done(null, false, {
								message: 'User not found'
							});
						}
					} catch (depError) {
						const dependency: string = 'passportJwtStrategy()';
						const dependencyError =
							new errorHandler.ErrorClasses.DependencyErrorRecoverable(
								`Failed to execute dependency: ${dependency}\n${depError instanceof Error ? depError.message : depError}`
							);
						errorLogger.logError(dependencyError.message);
						errorHandler.handleError({ error: dependencyError });
						return done(
							new Error(
								dependencyError instanceof Error
									? dependencyError.message
									: String(dependencyError)
							),
							false
						);
					}
				}
			)
		);

		passport.use(
			new LocalStrategy(async (username, password, done) => {
				try {
					validateDependencies(
						[
							{ name: 'username', instance: username },
							{ name: 'password', instance: password },
							{ name: 'done', instance: done }
						],
						logger
					);

					const user = await UserModel.findOne({
						where: { username }
					});
					if (!user) {
						logger.warn(
							`Local authentication failed: User not found: ${username}`
						);
						return done(null, false, { message: 'User not found' });
					}

					const isMatch = await user.comparePassword(
						password,
						argon2
					);

					if (isMatch) {
						logger.info(
							`Local authentication successful for user: ${username}`
						);
						return done(null, user);
					} else {
						logger.warn(
							`Local authentication failed: Incorrect password for user: ${username}`
						);
						return done(null, false, {
							message: 'Incorrect password'
						});
					}
				} catch (err) {
					const dependencyError =
						new errorHandler.ErrorClasses.DependencyErrorRecoverable(
							`Failed to execute dependency: Passport, Use Local Stratgegy\n${err instanceof Error ? err.message : err}`,
							{ exposeToClient: false }
						);
					errorLogger.logError(dependencyError.message);
					errorHandler.handleError({ error: dependencyError });
					return done(
						new Error(
							err instanceof Error ? err.message : String(err)
						)
					);
				}
			})
		);

		logger.info('Passport configured successfully');
	} catch (depError) {
		const dependencyError =
			new errorHandler.ErrorClasses.DependencyErrorFatal(
				`Failed to execute dependency: configurePassport()\n${depError instanceof Error ? depError.message : depError}`,
				{ exposeToClient: false }
			);
		errorHandler.handleError({ error: dependencyError });
		errorLogger.logError(dependencyError.message);
		throw new Error(
			dependencyError instanceof Error
				? dependencyError.message
				: String(dependencyError)
		);
	}
}
