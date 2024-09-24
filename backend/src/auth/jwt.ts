import {
	AppLoggerInterface,
	CreateJwtInterface,
	JwtUserInterface
} from '../index/interfaces';
import { CreateJwtParameters } from '../index/parameters';
import { configService } from '../services/configService';
import { envSecretsStore } from '../environment/envSecrets';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';
import jwt from 'jsonwebtoken';

export function createJwt(): {
	generateJwt: (user: JwtUserInterface) => Promise<string>;
	verifyJwt: (token: string) => Promise<string | object | null>;
} {
	const params: CreateJwtInterface = CreateJwtParameters;
	const logger: AppLoggerInterface = configService.getErrorLogger();
	const errorLogger: AppLoggerInterface = configService.getErrorLogger();

	const loadJwtSecret = async (): Promise<string> => {
		try {
			const secret = params.envSecretsStore.retrieveSecret(
				'JWT_SECRET',
				params.appLogger
			);

			if (!secret) {
				throw new Error('JWT_SECRET is not available.');
			}

			return secret;
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorFatal(
					`Failed to load secrets in 'jwtUtil - loadJwtSecret()'\n${utilError instanceof Error ? utilError.message : utilError}\nShutting down...`
				);
			params.errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			process.exit(1);
		} finally {
			params.appLogger.debug('JWT secret loaded successfully');
			params.envSecretsStore.reEncryptSecret('JWT	_SECRET');
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

			const pepper = await envSecretsStore.retrieveSecret(
				'JWT_SECRET',
				logger
			);

			if (!pepper) {
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
