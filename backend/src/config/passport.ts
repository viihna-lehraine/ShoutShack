import { PassportStatic } from 'passport';
import {
	Strategy as JwtStrategy,
	ExtractJwt,
	StrategyOptions
} from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import setupLogger from './logger';
import getSecrets from './secrets';
import UserModelPromise from '../models/User';

// Define the shape of a user instance based on User model
interface UserInstance {
	id: string;
	username: string;
	comparePassword: (password: string) => Promise<boolean>;
}

export default async function configurePassport(passport: PassportStatic) {
	let secrets = await getSecrets();
	let logger = await setupLogger();
	let UserModel = await UserModelPromise;

	let opts: StrategyOptions = {
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		secretOrKey: secrets.JWT_SECRET
	};

	passport.use(
		new JwtStrategy(
			opts,
			async (
				jwt_payload: { id: string },
				done: (
					error: Error | null,
					user?: UserInstance | false,
					info?: unknown
				) => void
			) => {
				try {
					let user = await UserModel.findByPk(jwt_payload.id);
					if (user) {
						logger.info(
							'JWT authentication successful for user ID: ',
							jwt_payload.id
						);
						return done(null, user);
					} else {
						logger.warn(
							'JWT authentication failed for user ID: ',
							jwt_payload.id
						);
						return done(null, false);
					}
				} catch (err) {
					logger.error('JWT authentication error: ', err);
					return done(err as Error, false);
				}
			}
		)
	);

	passport.use(
		new LocalStrategy(async (username, password, done) => {
			try {
				let user = await UserModel.findOne({ where: { username } });
				if (!user) {
					logger.warn(
						'Local authentication failed: User not found: ',
						username
					);
					return done(null, false, { message: 'User not found' });
				}

				let isMatch = await user.comparePassword(password);
				if (isMatch) {
					logger.info(
						'Local authentication successful for user: ',
						username
					);
					return done(null, user);
				} else {
					logger.warn(
						'Local authentication failed: incorrect password for user: ',
						username
					);
					return done(null, false, { message: 'Incorrect password' });
				}
			} catch (err) {
				logger.error(
					'Local authenticaton error for user: ',
					username,
					' : Error: ',
					err
				);
				return done(err);
			}
		})
	);
}
