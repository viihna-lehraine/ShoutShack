import { AuthControllerInterface } from '../index/interfaces';
import { Request, Response } from 'express';
import { ServiceFactory } from '../index/factory';

export function userLogin({
	argon2,
	jwt,
	UserModel,
	validateDependencies
}: AuthControllerInterface) {
	return async (req: Request, res: Response): Promise<Response | void> => {
		const logger = ServiceFactory.getLoggerService();
		const errorLogger = ServiceFactory.getErrorLoggerService();
		const errorHandler = ServiceFactory.getErrorHandlerService();

		try {
			validateDependencies(
				[
					{ name: 'UserModel', instance: UserModel },
					{ name: 'jwt', instance: jwt },
					{ name: 'argon2', instance: argon2 }
				],
				logger
			);
			const { username, password } = req.body;

			const user = await UserModel.findOne({ where: { username } });
			if (!user) {
				logger.debug(
					`Login attempt failed - user not found: ${username}`
				);
				const clientError =
					new errorHandler.ErrorClasses.ClientAuthenticationError(
						'Login attempt failed - please try again',
						{ exposeToClient: true }
					);
				errorHandler.sendClientErrorResponse({
					message: 'Login attempt failed. Please try again',
					res
				});
				errorHandler.handleError({ error: clientError });
				return;
			}

			const isPasswordValid = await user.comparePassword(
				password,
				argon2
			);
			if (!isPasswordValid) {
				logger.debug(
					`Login attempt failed - invalid password for user: ${username}`
				);
				const clientError =
					new errorHandler.ErrorClasses.ClientAuthenticationError(
						'Login attempt failed - please try again',
						{ exposeToClient: false }
					);
				errorHandler.sendClientErrorResponse({
					message: clientError.message,
					res
				});
			}

			const token = await jwt.generateJwt(user);
			logger.info(`User logged in successfully: ${username}`);
			return res.json({ token });
		} catch (depError) {
			const dependency: string = 'authController - login()';
			const dependencyError =
				new errorHandler.ErrorClasses.DependencyErrorRecoverable(
					`Dependency error: ${dependency}: ${depError instanceof Error ? depError.message : depError}`,
					{ exposeToClient: false }
				);
			errorLogger.logError(dependencyError.message);
			errorHandler.handleError({ error: dependencyError });
		}
	};
}
