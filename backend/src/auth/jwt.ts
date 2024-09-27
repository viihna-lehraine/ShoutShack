import { JwtUserInterface } from '../index/interfaces';
import { validateDependencies } from '../utils/helpers';
import jwt from 'jsonwebtoken';
import { ServiceFactory } from '../index/factory';

export function createJwt(): {
	generateJwt: (user: JwtUserInterface) => Promise<string>;
	verifyJwt: (token: string) => Promise<string | object | null>;
} {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();
	const secrets = ServiceFactory.getSecretsStore();

	const loadJwtSecret = async (): Promise<string> => {
		try {
			const secretResult = secrets.retrieveSecrets('JWT_SECRET');

			if (!secretResult) {
				throw new Error('JWT_SECRET is not available.');
			}

			if (typeof secretResult === 'string') {
				return secretResult;
			} else if (
				typeof secretResult === 'object' &&
				secretResult.JWT_SECRET
			) {
				return secretResult.JWT_SECRET as string;
			} else {
				throw new Error('JWT_SECRET is not available.');
			}
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorFatal(
					`Failed to load secrets in 'jwtUtil - loadJwtSecret()'\n${utilError instanceof Error ? utilError.message : utilError}\nShutting down...`
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			process.exit(1);
		} finally {
			logger.debug('JWT secret loaded successfully');
			secrets.reEncryptSecret('JWT	_SECRET');
		}
	};

	const generateJwt = async (user: JwtUserInterface): Promise<string> => {
		try {
			validateDependencies([{ name: 'user', instance: user }], logger);

			const pepper = await loadJwtSecret();

			if (!pepper) {
				logger.error('JWT_SECRET is not available.');
				throw new Error('JWT_SECRET is not available.');
			}

			return jwt.sign({ id: user.id, username: user.username }, pepper, {
				expiresIn: '1h'
			});
		} catch (utilError) {
			const utility: string = 'generateJwt()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate JWT in ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return '';
		}
	};

	const verifyJwt = async (
		token: string
	): Promise<string | object | null> => {
		try {
			validateDependencies([{ name: 'token', instance: token }], logger);

			const secretResult = secrets.retrieveSecrets('JWT_SECRET');

			let pepper: string;

			if (typeof secretResult === 'string') {
				pepper = secretResult;
			} else if (
				secretResult !== null &&
				typeof secretResult === 'object' &&
				secretResult.JWT_SECRET
			) {
				pepper = secretResult.JWT_SECRET as string;
			} else {
				logger.error('JWT_SECRET is not available.');
				throw new Error('JWT_SECRET is not available.');
			}

			return jwt.verify(token, pepper);
		} catch (utilError) {
			const utility: string = 'verifyJwt()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to verify JWT in ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return null;
		}
	};

	return {
		generateJwt,
		verifyJwt
	};
}
