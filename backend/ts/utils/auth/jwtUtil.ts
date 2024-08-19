import jwt from 'jsonwebtoken';
import getSecrets from '../../config/secrets';

interface Secrets {
    JWT_SECRET: string;
}

interface User {
    id: string;
    username: string;
}

let secrets: Secrets | undefined;

const loadSecrets = async () => {
    if (!secrets) {
        secrets = await getSecrets();
    }
    return secrets;
};

export const generateToken = async (user: User) => {
    const secrets = await loadSecrets();
    if (!secrets) {
        throw new Error('Secrets could not be loaded');
    }
    return jwt.sign(
        { id: user.id, username: user.username },
        secrets.JWT_SECRET,
        { expiresIn: '1h' },
    );
};

export const verifyJwToken = async (token: string) => {
    try {
        const secrets = await loadSecrets();
        if (!secrets) {
            throw new Error('Secrets could not be loaded');
        }
        return jwt.verify(token, secrets.JWT_SECRET);
    } catch (err) {
        return null;
    }
};

export default verifyJwToken;