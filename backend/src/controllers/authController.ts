import { Request, Response } from 'express';
import { Logger } from 'winston';
import createJwtUtil from '../utils/auth/jwtUtil';
import createUserModel from '../models/User';
import argon2 from 'argon2';
import sops from '../utils/sops';
import { execSync } from 'child_process';

interface AuthDependencies {
	logger: Logger;
	UserModel: ReturnType<typeof createUserModel>;
	jwtUtil: ReturnType<typeof createJwtUtil>;
	argon2: typeof argon2;
}

export const login =
	({ logger, UserModel, jwtUtil }: AuthDependencies) =>
	async (req: Request, res: Response): Promise<Response | null> => {
		try {
			const { username, password } = req.body;
			const user = await UserModel.findOne({ where: { username } });

			if (!user) {
				return res
					.status(401)
					.json({ msg: 'Login failed - invalid credentials' });
			}

			const secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});

			const isPasswordValid = await user.comparePassword(
				password,
				argon2,
				secrets
			);

			if (!isPasswordValid) {
				return res.status(401).json({ msg: 'Invalid credentials' });
			}

			// generate JWT token and use it to respond
			const token = await jwtUtil.generateToken(user);
			return res.json({ token });
		} catch (err) {
			logger.error(err);
			return res.status(500).json({ msg: 'Server error' });
		}
	};
