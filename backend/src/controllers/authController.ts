import { Request, Response } from 'express';
import { generateToken } from '../utils/auth/jwtUtil';
import setupLogger from '../config/logger';
import User from '../models/User';

const logger = await setupLogger();

export const login = async (
	req: Request,
	res: Response
): Promise<Response | null> => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ where: { username } });

		if (!user) {
			return res
				.status(401)
				.json({ message: 'Login failed - invalid credentials' });
		}

		const isPasswordValid = await user.comparePassword(password);

		if (!isPasswordValid) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		// Generate JWT token and use it to respond
		const token = await generateToken(user);
		res.json({ token });
	} catch (err) {
		logger.error(err);
		res.status(500).json({ message: 'Server error' });
	}

	return null; // unreachable code, but it satisfies TypeScript *shrug*
};
