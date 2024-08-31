import { PassportStatic } from 'passport';
import {
	Strategy as JwtStrategy,
	ExtractJwt,
	StrategyOptions
} from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Sequelize } from 'sequelize';

import createUserModel from '../models/User';

interface UserInstance {
	id: string;
	username: string;
	comparePassword: (password: string) => Promise<boolean>;
}

interface PassportSecrets {
	JWT_SECRET: string;
	PEPPER: string;
}

interface PassportDependencies {
	passport: PassportStatic;
	logger: ReturnType<typeof import('./logger').default>;
	getSecrets: () => Promise<PassportSecrets>;
	UserModel: ReturnType<typeof createUserModel>;
	argon2: typeof import('argon2');
}

export default async function configurePassport({
	passport,
	logger,
	getSecrets,
	UserModel,
	argon2
}: PassportDependencies) {
	const secrets = await getSecrets();

	const opts: StrategyOptions = {
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		secretOrKey: secrets.JWT_SECRET
	};

	passport.use(
		new LocalStrategy(async (username, password, done) => {
			try {
				const user = await UserModel.findOne({ where: { username } });
				if (!user) {
					logger.warn(`Local authentication failed: User not found: ${username}`);
					return done(null, false, { message: 'User not found' });
				}

				const secrets = await getSecrets(); // Get the secrets

				// Use the comparePassword method with all necessary dependencies
				const isMatch = await user.comparePassword(password, argon2, secrets);

				if (isMatch) {
					logger.info(`Local authentication successful for user: ${username}`);
					return done(null, user);
				} else {
					logger.warn(
						`Local authentication failed: Incorrect password for user: ${username}`
					);
					return done(null, false, { message: 'Incorrect password' });
				}
			} catch (err) {
				logger.error(
					`Local authentication error for user ${username}: Error: ${err}`,
				);
				return done(err);
			}
		})
	);
}
