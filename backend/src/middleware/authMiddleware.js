import { verifyJwToken } from '../utils/auth/jwtUtil';

export const authenticateJwT = async (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		return res.sendStatus(403);
	}

	const user = await verifyToken(token);

	if (!user) {
		return res.sendStatus(403);
	}

	req.user = user;
	next();
};
