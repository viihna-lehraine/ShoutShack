import { NextFunction, Request, Response } from 'express';
import { AuthenticateOptions, PassportStatic } from 'passport';
import { Logger } from '../config/logger';

interface PassportAuthMiddlewareDependencies {
	passport: PassportStatic;
	authenticateOptions: AuthenticateOptions;
	logger: Logger;
}

export const createPassportAuthMiddleware = ({
	passport,
	authenticateOptions,
	logger
}: PassportAuthMiddlewareDependencies) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		passport.authenticate(
			'jwt',
			authenticateOptions,
			(err: Error | null, user: Express.User | false) => {
				if (err) {
					logger.error(
						`Passport authentication error: ${err.message}`
					);
					res.status(500).json({ error: 'Internal Server Error' });
					return;
				}
				if (!user) {
					logger.warn('Unauthorized access attempt');
					res.status(401).json({ error: 'Unauthorized' });
					return;
				}
				req.user = user;
				return next();
			}
		)(req, res, next);
	};
};
