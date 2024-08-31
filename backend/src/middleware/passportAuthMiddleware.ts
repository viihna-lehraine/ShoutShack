import { NextFunction, Request, Response } from 'express';
import { AuthenticateOptions, PassportStatic } from 'passport';

interface PassportAuthMiddlewareDependencies {
	passport: PassportStatic;
	authenticateOptions: AuthenticateOptions;
}

export const createPassportAuthMiddleware = ({
	passport,
	authenticateOptions
}: PassportAuthMiddlewareDependencies) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		passport.authenticate(
			'jwt',
			authenticateOptions,
			(err: Error | null, user: Express.User | false) => {
				if (err || !user) {
					return res.status(401).json({ error: 'Unauthorized' });
				}
				req.user = user;
				return next();
			}
		)(req, res, next);
	};
};
