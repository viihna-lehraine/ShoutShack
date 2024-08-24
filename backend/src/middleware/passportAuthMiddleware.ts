import { NextFunction, Request, Response } from 'express';
import passport, { AuthenticateOptions } from 'passport';

export const authenticate = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	passport.authenticate(
		'jwt',
		{ session: false } as AuthenticateOptions,
		(err: Error | null, user: Express.User | false) => {
			if (err || !user) {
				return res.status(401).json({ error: 'Unauthorized' });
			}
			req.user = user;
			return next;
		}
	)(req, res, next);
};
