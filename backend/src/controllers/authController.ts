import argon2 from 'argon2';
import { execSync } from 'child_process';
import { Request, Response } from 'express';
import { createJwtUtil } from '../auth/jwtUtil';
import sops from '../environment/envSecrets';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError, sendClientErrorResponse } from '../errors/processError';
import createUserModel from '../models/UserModelFile';
import { Logger } from '../utils/logger';
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
					{ name: 'argon2', instance: argon2 },
					{ name: 'secrets', instance: sops }
				],
				logger || console
			);
			const { username, password } = req.body;

			const user = await UserModel.findOne({ where: { username } });
			if (!user) {
				logger.debug(
					`Login attempt failed - user not found: ${username}`
				);
				const clientError = new errorClasses.ClientAuthenticationError(
					'Login attempt failed - please try again',
					{ exposeToClient: true }
				);
				sendClientErrorResponse(clientError, res);
				return;
			}

			const secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});

			const isPasswordValid = await user.comparePassword(
				password,
				argon2,
				secrets,
				logger
			);
			if (!isPasswordValid) {
				logger.debug(
					`Login attempt failed - invalid password for user: ${username}`
				);
				const clientError = new errorClasses.ClientAuthenticationError(
					'Login attempt failed - please try again',
					{ exposeToClient: true }
				);
				sendClientErrorResponse(clientError, res);
			}

			const token = await jwtUtil.generateJwt(user);
			logger.info(`User logged in successfully: ${username}`);
			return res.json({ token });
		} catch (depError) {
			const dependency: string = 'authController - login()';
			const dependencyError = new errorClasses.DependencyErrorRecoverable(
				`Dependency error: ${dependency}: ${depError instanceof Error ? depError.message : depError}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(dependencyError, logger);
			processError(dependencyError, logger || console);
		}
	};
}
