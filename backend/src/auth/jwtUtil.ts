import jwt from 'jsonwebtoken';
import { Logger } from 'winston';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
import sops from '../utils/sops';
import { execSync } from 'child_process';

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
		} catch (error) {
			processError(error, logger);
			throw new Error('Failed to load secrets');
		}
	};

	const loadAndCacheSecrets = async (): Promise<void> => {
		if (!secrets) {
			logger.info('Secrets not found. Loading secrets...');
			try {
				secrets = await loadSecrets();
			} catch (error) {
				processError(error, logger);
				throw new Error('Failed to load and cache secrets');
			}
		}
	};

	const generateJwt = async (user: User): Promise<string> => {
		try {
			validateDependencies([{ name: 'user', instance: user }], logger);

			await loadAndCacheSecrets();

			if (!secrets.JWT_SECRET) {
				logger.error('JWT_SECRET is not available.');
				throw new Error('JWT_SECRET is not available.');
			}

			return jwt.sign(
				{ id: user.id, username: user.username },
				secrets.JWT_SECRET,
				{ expiresIn: '1h' }
			);
		} catch (error) {
			processError(error, logger);
			throw new Error('Failed to generate JWT token');
		}
	};

	const verifyJwt = async (
		token: string
	): Promise<string | object | null> => {
		try {
			validateDependencies([{ name: 'token', instance: token }], logger);

			await loadAndCacheSecrets();

			if (!secrets.JWT_SECRET) {
				logger.error('JWT_SECRET is not available.');
				throw new Error('JWT_SECRET is not available.');
			}

			return jwt.verify(token, secrets.JWT_SECRET);
		} catch (error) {
			if (error instanceof jwt.JsonWebTokenError) {
				logger.warn(`JWT verification error: ${error.message}`, {
					name: error.name,
					message: error.message,
					stack: error.stack
				});
				return null;
			} else {
				processError(error, logger);
				throw new Error('Failed to verify JWT token');
			}
		}
	};

	return {
		generateJwt,
		verifyJwt
	};
}

export default createJwtUtil;
