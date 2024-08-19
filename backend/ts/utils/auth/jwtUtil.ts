import jwt from 'jsonwebtoken';
import getSecrets from '../../config/secrets.js';

let secrets;

const loadSecrets = async () => {
    if (!secrets) {
        secrets = await getSecrets();
    }
    return secrets;
};

export const generateToken = async (user) => {
    const secrets = await loadSecrets();
    return jwt.sign(
        { id: user.id, username: user.username },
        secrets.JWT_SECRET,
        { expiresIn: '1h' },
    );
};

export const verifyJwToken = async (token) => {
    try {
        const secrets = await loadSecrets();
        return jwt.verify(token, secrets.JWT_SECRET);
    } catch (err) {
        return null;
    }
};

export default verifyJwToken;