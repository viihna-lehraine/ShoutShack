import { Strategy as LocalStrategy } from 'passport-local';
import {
	ExtractJwt,
	Strategy as JwtStrategy,
	StrategyOptions,
	VerifiedCallback
} from 'passport-jwt';
import { configService } from '../services/configService';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/helpers';
import { PassportServiceInterface } from 'src/index/serviceInterfaces';

export async function configurePassport({
	passport,
	UserModel,
	argon2
}: PassportServiceInterface): Promise<void> {
	const appLogger = configService.getAppLogger();

	try {
		validateDependencies(
			[
				{ name: 'passport', instance: passport },
				{ name: 'UserModel', instance: UserModel },
				{ name: 'argon2', instance: argon2 }
			],
			appLogger || console
		);

		const opts: StrategyOptions = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: secrets.jwtSecrets
		};

		// implement JWT strategy
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
							appLogger || console
						);
						const user = await UserModel.findByPk(jwtPayload.id);
						if (user) {
							appLogger.info(
								`JWT authentication successful for user: ${user.username}`
							);
							return done(null, user);
						} else {
							appLogger.warn(
								'JWT authentication failed: User not found'
							);
							return done(null, false, {
								message: 'User not found'
							});
						}
					} catch (depError) {
						const dependency: string = 'passportJwtStrategy()';
						const dependencyError =
							new errorClasses.DependencyErrorRecoverable(
								dependency,
								{ exposeToClient: false }
							);
						errorLogger.logError(dependencyError);
						processError(dependencyError);
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

		// implement local strategy for username and password login
		passport.use(
			new LocalStrategy(async (username, password, done) => {
				try {
					validateDependencies(
						[
							{ name: 'username', instance: username },
							{ name: 'password', instance: password },
							{ name: 'done', instance: done }
						],
						appLogger || console
					);

					const user = await UserModel.findOne({
						where: { username }
					});
					if (!user) {
						appLogger.warn(
							`Local authentication failed: User not found: ${username}`
						);
						return done(null, false, { message: 'User not found' });
					}

					const isMatch = await user.comparePassword(
						password,
						argon2
					);

					if (isMatch) {
						appLogger.info(
							`Local authentication successful for user: ${username}`
						);
						return done(null, user);
					} else {
						appLogger.warn(
							`Local authentication failed: Incorrect password for user: ${username}`
						);
						return done(null, false, {
							message: 'Incorrect password'
						});
					}
				} catch (err) {
					const dependency: string = 'passportLocalStrategy()';
					const dependencyError =
						new errorClasses.DependencyErrorRecoverable(
							dependency,
							{ exposeToClient: false }
						);
					errorLogger.logError(dependencyError);
					processError(dependencyError);
					return done(
						new Error(
							err instanceof Error ? err.message : String(err)
						)
					);
				}
			})
		);

		appLogger.info('Passport configured successfully');
	} catch (depError) {
		const dependency: string = 'configurePassport()';
		const dependencyError = new errorClasses.DependencyErrorFatal(
			dependency,
			{ exposeToClient: false }
		);
		processError(dependencyError);
		errorLogger.logError(dependencyError);
		throw new Error(
			dependencyError instanceof Error
				? dependencyError.message
				: String(dependencyError)
		);
	}
}
