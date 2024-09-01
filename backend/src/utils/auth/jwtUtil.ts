import jwt from 'jsonwebtoken';
import setupLogger from '../../config/logger';
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
	return sops.getSecrets({
		logger,
		execSync,
		getDirectoryPath: () => process.cwd()
	});
}

export function createJwtUtil(): {
	generateToken: (user: User) => Promise<string>;
	verifyJwtToken: (token: string) => Promise<string | object | null>;
} {
	let secrets: Secrets;

	const loadAndCacheSecrets = async (): Promise<void> => {
		if (!secrets) {
			secrets = await loadSecrets();
		}
	};

	const generateToken = async (user: User): Promise<string> => {
		await loadAndCacheSecrets();
		return jwt.sign(
			{ id: user.id, username: user.username },
			secrets.JWT_SECRET as string,
			{ expiresIn: '1h' }
		);
	};

	const verifyJwtToken = async (
		token: string
	): Promise<string | object | null> => {
		await loadAndCacheSecrets();
		try {
			return jwt.verify(token, secrets.JWT_SECRET as string);
		} catch (err) {
			logger.error(err);
			return null;
		}
	};

	return {
		generateToken,
		verifyJwtToken
	};
}

export default createJwtUtil;
