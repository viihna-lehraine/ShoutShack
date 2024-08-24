import jwt from 'jsonwebtoken';
import setupLogger from '../../config/logger';
import getSecrets from '../../config/secrets';

interface Secrets {
	JWT_SECRET: string;
}

interface User {
	id: string;
	username: string;
}

const logger = await setupLogger();
const secrets: Secrets = await getSecrets();

if (!secrets) {
	throw new Error('Secrets could not be loaded');
}

export const generateToken = async (user: User): Promise<string> => {
	return jwt.sign(
		{ id: user.id, username: user.username },
		secrets.JWT_SECRET,
		{ expiresIn: '1h' }
	);
};

export const verifyJwToken = async (
	token: string
): Promise<string | object | null> => {
	try {
		return jwt.verify(token, secrets.JWT_SECRET);
	} catch (err) {
		logger.error(err);
		return null;
	}
};

export default verifyJwToken;
