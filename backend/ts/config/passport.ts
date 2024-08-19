import { PassportStatic } from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import setupLogger from '../middleware/logger.js';
import getSecrets from './secrets.js';
import UserModelPromise from '../models/User.js';

export default async function configurePassport(passport: PassportStatic) {
    const secrets = await getSecrets();
    const logger = await setupLogger();
    const UserModel = await UserModelPromise;

    const opts: StrategyOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: secrets.JWT_SECRET,
    };

    passport.use(
        new JwtStrategy(opts, async (jwt_payload: { id: string }, done: (error: any, user?: any, info?: any) => void) => {
            try {
                const user = await UserModel.findByPk(jwt_payload.id);
                if (user) {
                    logger.info('JWT authentication successful for user ID: ', jwt_payload.id);
                    return done(null, user);
                } else {
                    logger.warn('JWT authentication failed for user ID: ', jwt_payload.id);
                    return done(null, false);
                }
            } catch (err) {
                logger.error('JWT authentication error: ', err);
                return done(err, false);
            }
        })
    );

    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await UserModel.findOne({ where: { username } });
                if (!user) {
                    logger.warn('Local authentication failed: User not found: ', username);
                    return done(null, false, { message: 'User not found' });
                }

                const isMatch = await user.comparePassword(password);
                if (isMatch) {
                    logger.info('Local authentication successful for user: ', username);
                    return done(null, user);
                } else {
                    logger.warn('Local authentication failed: incorrect password for user: ', username);
                    return done(null, false, { message: 'Incorrect password' });
                }
            } catch (err) {
                logger.error('Local authenticaton error for user: ', username, ' : Error: ', err);
                return done(err);
            }
        })
    );
}