import { NextFunction, Request, Response } from 'express';
import { verifyJwToken } from '../utils/auth/jwtUtil';

export const authenticateJwT = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		res.sendStatus(403);
		return;
	}

	const user = await verifyJwToken(token);

	if (!user) {
		res.sendStatus(403);
		return;
	}

	req.user = user;
	next();
};
