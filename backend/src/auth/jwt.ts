import { CreateJwtInterface, JwtUserInterface } from '../index/interfaces';
import { CreateJwtParameters } from '../index/parameters';

export function createJwt(paramsObject: CreateJwtInterface): {
	generateJwt: (user: JwtUser) => Promise<string>;
	verifyJwt: (token: string) => Promise<string | object | null>;
} {
	const params: CreateJwtInterface = CreateJwtParameters;

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
			const utilityError = new params.errorClasses.UtilityErrorFatal(
				`Failed to load secrets in 'jwtUtil - loadJwtSecret()'\n${utilError instanceof Error ? utilError.message : utilError}\nShutting down...`,
				{
					originalError: utilError,
					statusCode: 500,
					ErrorSeverity: params.ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			params.errorLogger.logError(
				utilityError.message,
				params.errorLoggerDetails(getCallerInfo, 'JWT_INIT'),
			);
			processError(utilityError, logger);
			process.exit(1);
		}
	};

	const generateJwt = async (user: JwtUser): Promise<string> => {
		try {
			validateDependencies([{ name: 'user', instance: user }], logger);

			if (!secrets) {
				secrets = await loadJwtSecret();
			}

			if (!secrets.JWT_SECRET) {
				logger.error('JWT_SECRET is not available.');
				throw new Error('JWT_SECRET is not available.');
			}

			return jwt.sign(
				{ id: user.id, username: user.username },
				secrets.JWT_SECRET,
				{ expiresIn: '1h' }
			);
		} catch (utilError) {
			const utility: string = 'generateJwt()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to generate JWT in ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
			return '';
		}
	};

	const verifyJwt = async (
		token: string
	): Promise<string | object | null> => {
		try {
			validateDependencies([{ name: 'token', instance: token }], logger);

			if (!secrets) {
				secrets = await loadSecrets();
			}

			if (!secrets.JWT_SECRET) {
				logger.error('JWT_SECRET is not available.');
				throw new Error('JWT_SECRET is not available.');
			}

			return jwt.verify(token, secrets.JWT_SECRET);
		} catch (utilError) {
			const utility: string = 'verifyJwt()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to verify JWT in ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
			return null;
		}
	};

	return {
		generateJwt,
		verifyJwt
	};
}
