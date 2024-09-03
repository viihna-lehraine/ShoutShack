import jwt from 'jsonwebtoken';
import { setupLogger } from '../../config/logger';
import sops from '../sops';
import { execSync } from 'child_process';

interface Secrets {
	JWT_SECRET?: string;
}

interface User {
	id: string;
	username: string;
}

const logger = setupLogger();

async function loadSecrets(): Promise<Secrets> {
	try {
		const secrets = await sops.getSecrets({
			logger,
			execSync,
			getDirectoryPath: () => process.cwd()
		});

		if (!secrets.JWT_SECRET) {
			throw new Error('JWT_SECRET is not defined in secrets.');
		}

		return secrets as Secrets;
	} catch (error) {
		logger.error(
			`Failed to load secrets: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error('Failed to load secrets');
	}
}

export function createJwtUtil(): {
	generateToken: (user: User) => Promise<string>;
	verifyJwtToken: (token: string) => Promise<string | object | null>;
} {
	let secrets: Secrets;

	const loadAndCacheSecrets = async (): Promise<void> => {
		if (!secrets) {
			logger.info('Secrets not found. Loading secrets...');
			secrets = await loadSecrets();
		}
	};

	const generateToken = async (user: User): Promise<string> => {
		await loadAndCacheSecrets();

		if (!secrets.JWT_SECRET) {
			logger.error('JWT_SECRET is not available.');
			throw new Error('JWT_SECRET is not available.');
		}

		try {
			return jwt.sign(
				{ id: user.id, username: user.username },
				secrets.JWT_SECRET,
				{ expiresIn: '1h' }
			);
		} catch (error) {
			logger.error(
				`Failed to generate JWT token: ${error instanceof Error ? error.message : String(error)}`
			);
			throw new Error('Failed to generate JWT token');
		}
	};

	const verifyJwtToken = async (
		token: string
	): Promise<string | object | null> => {
		await loadAndCacheSecrets();

		if (!secrets.JWT_SECRET) {
			logger.error('JWT_SECRET is not available.');
			throw new Error('JWT_SECRET is not available.');
		}

		try {
			return jwt.verify(token, secrets.JWT_SECRET);
		} catch (error) {
			logger.error(
				`Failed to verify JWT token: ${error instanceof Error ? error.message : String(error)}`
			);
			return null;
		}
	};

	return {
		generateToken,
		verifyJwtToken
	};
}

export default createJwtUtil;
