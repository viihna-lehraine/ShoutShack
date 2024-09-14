import argon2 from 'argon2';
import { execSync } from 'child_process';
import { Request, Response } from 'express';
import createJwtUtil from '../auth/jwtUtil';
import { Logger } from '../utils/logger';
import createUserModel from '../models/UserModelFile';
import sops from '../utils/sops';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';

interface AuthDependencies {
	logger: Logger;
	UserModel: ReturnType<typeof createUserModel>;
	jwtUtil: ReturnType<typeof createJwtUtil>;
	argon2: typeof argon2;
}

export function login({
	logger,
	UserModel,
	jwtUtil,
	argon2
}: AuthDependencies) {
	return async (req: Request, res: Response): Promise<Response | void> => {
		try {
			validateDependencies(
				[
					{ name: 'logger', instance: logger },
					{ name: 'UserModel', instance: UserModel },
					{ name: 'jwtUtil', instance: jwtUtil },
					{ name: 'argon2', instance: argon2 }
				],
				logger || console
			);
			const { username, password } = req.body;

			// find user by username
			const user = await UserModel.findOne({ where: { username } });
			if (!user) {
				logger.warn(
					`Login attempt failed - user not found: ${username}`
				);
				return res.status(401).json({ msg: 'Invalid credentials' });
			}

			// fetch secrets
			const secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});

			// validate password using argon2 and secrets
			const isPasswordValid = await user.comparePassword(
				password,
				argon2,
				secrets,
				logger
			);
			if (!isPasswordValid) {
				logger.warn(
					`Login attempt failed - invalid password for user: ${username}`
				);
				return res.status(401).json({ msg: 'Invalid credentials' });
			}

			// generate JWT token and use it to respond
			const token = await jwtUtil.generateJwt(user);
			logger.info(`User logged in successfully: ${username}`);
			return res.json({ token });
		} catch (err) {
			processError(err, logger || console);
			throw err;
		}
	};
}
