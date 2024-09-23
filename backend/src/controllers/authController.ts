import { AuthController } from '../index/controllerInterfaces';

export function userLogin({
	argon2,
	execSync,
	jwt,
	req,
	res,
	appLogger,
	createJwt,
	errorClasses,
	ErrorLogger,
	ErrorSeverity,
	processError,
	sendClientErrorResponse,
	UserModel,
	validateDependencies
}: AuthController) {
	return async (req: Request, res: Response): Promise<Response | void> => {
		try {
			validateDependencies(
				[
					{ name: 'appLogger', instance: appLogger },
					{ name: 'UserModel', instance: UserModel },
					{ name: 'jwt', instance: jwt },
					{ name: 'argon2', instance: argon2 }
				],
				appLogger
			);
			const { username, password } = req.body;

			const user = await UserModel.findOne({ where: { username } });
			if (!user) {
				appLogger.debug(
					`Login attempt failed - user not found: ${username}`
				);
				const clientError = new errorClasses.ClientAuthenticationError(
					'Login attempt failed - please try again',
					{ exposeToClient: true }
				);
				sendClientErrorResponse(String(clientError), 404, res);
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
