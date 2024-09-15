import { execSync } from 'child_process';
import jwt from 'jsonwebtoken';
import { Logger } from 'winston';
import sops from '../config/sops';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/validateDependencies';

interface Secrets {
	JWT_SECRET?: string;
}

interface User {
	id: string;
	username: string;
}

export function createJwtUtil(logger: Logger): {
	generateJwt: (user: User) => Promise<string>;
	verifyJwt: (token: string) => Promise<string | object | null>;
} {
	let secrets: Secrets;

	const loadSecrets = async (): Promise<Secrets> => {
		try {
			validateDependencies(
				[
					{ name: 'logger', instance: logger },
					{ name: 'execSync', instance: execSync }
				],
				logger
			);

			const secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});

			validateDependencies(
				[{ name: 'secrets.JWT_SECRET', instance: secrets.JWT_SECRET }],
				logger
			);

			return secrets;
		} catch (utilError) {
			const utility: string = 'jwtUtil - loadSecrets()';
			const utilityError = new errorClasses.UtilityErrorFatal(
				`Failed to load secrets in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Shutting down...`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
			process.exit(1);
		}
	};

	const generateJwt = async (user: User): Promise<string> => {
		try {
			validateDependencies([{ name: 'user', instance: user }], logger);

			if (!secrets) {
				secrets = await loadSecrets();
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
