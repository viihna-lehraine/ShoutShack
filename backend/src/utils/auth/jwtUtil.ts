import jwt from 'jsonwebtoken';
import setupLogger from '../../config/logger';
import getSecrets from '../../config/sops';

interface Secrets {
	JWT_SECRET: string;
}

interface User {
	id: string;
	username: string;
}

const logger = setupLogger();
const secrets: Secrets = await getSecrets.getSecrets();

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
