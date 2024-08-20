import { Request, Response } from 'express';
import { generateToken } from '../utils/auth/jwtUtil';
import UserModelPromise from '../models/User';

export const login = async (req: Request, res: Response) => {
	try {
		const User = await UserModelPromise;

		const { username, password } = req.body;

		// Correctly type `user` and ensure the correct model is used
		const user = await User.findOne({ where: { username } });

		if (!user) {
			return res
				.status(401)
				.json({ message: 'Login failed - invalid credentials' });
		}

		// Use the comparePassword method from the User model
		const isPasswordValid = await user.comparePassword(password);

		if (!isPasswordValid) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		// Generate JWT token
		const token = await generateToken(user);

		// Respond with the token
		res.json({ token });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}

	return; // unreachable code, but it satisfies TypeScript *shrug*
};
