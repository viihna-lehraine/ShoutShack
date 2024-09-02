import { PassportStatic } from 'passport';
import {
	Strategy as JwtStrategy,
	ExtractJwt,
	StrategyOptions,
	VerifiedCallback
} from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Logger } from './logger';

import createUserModel from '../models/User';

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
		const secrets = await getSecrets();

		const opts: StrategyOptions = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: secrets.JWT_SECRET
		};

		// implement JWT strategy
		passport.use(
			new JwtStrategy(opts, async (jwtPayload, done: VerifiedCallback) => {
				try {
					const user = await UserModel.findByPk(jwtPayload.id);
					if (user) {
						logger.info(`JWT authentication successful for user: ${user.username}`);
						return done(null, user);
					} else {
						logger.warn('JWT authentication failed: User not found');
						return done(null, false, { message: 'User not found' });
					}
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : String(err);
					logger.error(`JWT authentication error: ${errorMsg}`);
					return done(new Error(errorMsg), false);
				}
			})
		);

		// implement local strategy for username and password login
		passport.use(
			new LocalStrategy(async (username, password, done) => {
				try {
					const user = await UserModel.findOne({ where: { username } });
					if (!user) {
						logger.warn(`Local authentication failed: User not found: ${username}`);
						return done(null, false, { message: 'User not found' });
					}

					// use the comparePassword method with all necessary dependencies
					const isMatch = await user.comparePassword(password, argon2, secrets);

					if (isMatch) {
						logger.info(`Local authentication successful for user: ${username}`);
						return done(null, user);
					} else {
						logger.warn(`Local authentication failed: Incorrect password for user: ${username}`);
						return done(null, false, { message: 'Incorrect password' });
					}
				} catch (err) {
					const errorMsg = err instanceof Error ? err.message : String(err);
					logger.error(`Local authentication error for user ${username}: ${errorMsg}`);
					return done(new Error(errorMsg));
				}
			})
		);

		logger.info('Passport configured successfully');
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logger.error(`Error configuring passport: ${errorMsg}`);
		throw new Error(errorMsg);
	}
}
