import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import getSecrets from '../../config/secrets.js';

let secrets;

(async () => {
	secrets = await getSecrets();
})();

async function generateEmail2FACode() {
	if (!secrets) {
		secrets = await getSecrets();
	}

	const email2FACode = bcrypt.genSalt(6); // generates a 6-character hex code
	const email2FAToken = jwt.sign({ email2FACode }, secrets.EMAIL_2FA_KEY, {
		expiresIn: '30m',
	});
	return {
		email2FACode,
		email2FAToken,
	};
}

async function verifyEmail2FACode() {
	if (!secrets) {
		secrets = await getSecrets();
	}

	try {
		const decodedEmail2FACode = jwt.verify(
			email2FAToken,
			secrets.EMAIL_2FA_KEY
		);
		return decodedEmail2FACode.code === email2FACode;
	} catch (err) {
		return false;
	}
}

export { generateEmail2FACode, verifyEmail2FACode };
