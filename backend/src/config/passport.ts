import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import {
	ExtractJwt,
	Strategy as JwtStrategy,
	StrategyOptions,
	VerifiedCallback
} from 'passport-jwt';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import createUserModel from '../models/UserModelFile';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export interface UserInstance {
	id: string;
	username: string;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2'),
		secrets: PassportSecrets
	) => Promise<boolean>;
}

interface PassportSecrets {
	JWT_SECRET: string;
	PEPPER: string;
}

interface PassportDependencies {
	readonly passport: PassportStatic;
	readonly logger: Logger;
	readonly getSecrets: () => Promise<PassportSecrets>;
	readonly UserModel: ReturnType<typeof createUserModel>;
	readonly argon2: typeof import('argon2');
}

export default async function configurePassport({
	passport,
	logger,
	getSecrets,
	UserModel,
	argon2
}: PassportDependencies): Promise<void> {
	try {
		validateDependencies(
			[
				{ name: 'passport', instance: passport },
				{ name: 'logger', instance: logger },
				{ name: 'getSecrets', instance: getSecrets },
				{ name: 'UserModel', instance: UserModel },
				{ name: 'argon2', instance: argon2 }
			],
			logger || console
		);

		const secrets = await getSecrets();

		const opts: StrategyOptions = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: secrets.JWT_SECRET
		};

		// implement JWT strategy
		passport.use(
			new JwtStrategy(opts, async (jwtPayload, done: VerifiedCallback) => {
				try {
					validateDependencies(
						[
							{ name: 'jwtPayload', instance: jwtPayload },
							{ name: 'jwtPayload', instance: jwtPayload },
							{ name: 'done', instance: done }
						],
						logger || console
					);
					const user = await UserModel.findByPk(jwtPayload.id);
					if (user) {
						logger.info(`JWT authentication successful for user: ${user.username}`);
						return done(null, user);
					} else {
						logger.warn('JWT authentication failed: User not found');
						return done(null, false, { message: 'User not found' });
					}
				} catch (depError) {
					const dependency: string = 'passportJwtStrategy()';
					const dependencyError = new errorClasses.DependencyErrorRecoverable(
						dependency,
						{ exposeToClient: false }
					);
					ErrorLogger.logError(dependencyError, logger);
					processError(dependencyError, logger || console);
					return done(new Error(dependencyError instanceof Error ? dependencyError.message : String(dependencyError)), false);
				}
			})
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
						logger || console
					);

					const user = await UserModel.findOne({ where: { username } });
					if (!user) {
						logger.warn(`Local authentication failed: User not found: ${username}`);
						return done(null, false, { message: 'User not found' });
					}

					const isMatch = await user.comparePassword(password, argon2, secrets, logger);

					if (isMatch) {
						logger.info(`Local authentication successful for user: ${username}`);
						return done(null, user);
					} else {
						logger.warn(`Local authentication failed: Incorrect password for user: ${username}`);
						return done(null, false, { message: 'Incorrect password' });
					}
				} catch (err) {
					const dependency: string = 'passportLocalStrategy()';
					const dependencyError = new errorClasses.DependencyErrorRecoverable(
						dependency,
						{ exposeToClient: false }
					);
					ErrorLogger.logError(dependencyError, logger);
					processError(dependencyError, logger || console);
					return done(new Error(err instanceof Error ? err.message : String(err)));
				}
			})
		);

		logger.info('Passport configured successfully');
	} catch (depError) {
		const dependency: string = 'configurePassport()';
		const dependencyError = new errorClasses.DependencyErrorFatal(
			dependency,
			{ exposeToClient: false }
		);
		processError(dependencyError, logger || console);
		ErrorLogger.logError(dependencyError, logger);
		throw new Error(dependencyError instanceof Error ? dependencyError.message : String(dependencyError));
	}
}
