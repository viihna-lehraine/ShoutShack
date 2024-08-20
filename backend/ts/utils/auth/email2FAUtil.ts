import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import getSecrets from '../../config/secrets.js';

interface Secrets {
	EMAIL_2FA_KEY: string;
}

let secrets: Secrets | undefined;

async function getSecretsOrThrow(): Promise<Secrets> {
	if (!secrets) {
		secrets = await getSecrets();
		if (!secrets) {
			throw new Error('Secrets could not be loaded');
		}
	}

	return secrets;
}

async function generateEmail2FACode() {
	const secrets = await getSecretsOrThrow();

	const email2FACode = await bcrypt.genSalt(6); // generates a 6-character hex code
	const email2FAToken = jwt.sign({ email2FACode }, secrets.EMAIL_2FA_KEY, {
		expiresIn: '30m'
	});
	return {
		email2FACode, // raw 2FA code
		email2FAToken // JWT containing the 2FA code
	};
}

async function verifyEmail2FACode(token: string, email2FACode: string) {
	const secrets = await getSecretsOrThrow();

	try {
		const decodedEmail2FACode = jwt.verify(
			token,
			secrets.EMAIL_2FA_KEY
		) as JwtPayload;

		// ensue the decoded 2FA code matches the one provided
		return decodedEmail2FACode.code === email2FACode;
	} catch (err) {
		return false;
	}
}

export { generateEmail2FACode, verifyEmail2FACode };
