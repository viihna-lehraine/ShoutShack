import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Logger } from 'winston';

interface Secrets {
	EMAIL_2FA_KEY: string;
}

interface Email2FAUtilDependencies {
	logger: Logger;
	getSecrets: () => Promise<Secrets>;
	bcrypt: typeof bcrypt;
	jwt: typeof jwt;
}

export default async function createEmail2FAUtil({
	logger,
	getSecrets,
	bcrypt,
	jwt
}: Email2FAUtilDependencies): Promise<{
	generateEmail2FACode: () => Promise<{
		email2FACode: string;
		email2FAToken: string;
	}>;
	verifyEmail2FACode: (
		token: string,
		email2FACode: string
	) => Promise<boolean>;
}> {
	let secrets: Secrets;

	try {
		secrets = await getSecrets();

		if (!secrets.EMAIL_2FA_KEY) {
			logger.error('Missing EMAIL_2FA_KEY in secrets');
		}
	} catch (err) {
		logger.error(
			`Failed to load secrets: ${err instanceof Error ? err.message : String(err)}`
		);
		logger.error(
			'Email 2FA functionality will not work. Secrets could not be loaded'
		);
	}

	// generate a 2FA code and corresponding JWT token
	async function generateEmail2FACode(): Promise<{
		email2FACode: string;
		email2FAToken: string;
	}> {
		try {
			const email2FACode = await bcrypt.genSalt(6);
			const email2FAToken = jwt.sign(
				{ email2FACode },
				secrets.EMAIL_2FA_KEY,
				{
					expiresIn: '30m'
				}
			);

			return {
				email2FACode, // raw 2FA code
				email2FAToken // JWT containing the 2FA code
			};
		} catch (err) {
			logger.error(
				`Error generating email 2FA code: ${err instanceof Error ? err.message : String(err)}`
			);
			throw new Error('Failed to generate email 2FA code');
		}
	}

	async function verifyEmail2FACode(
		token: string,
		email2FACode: string
	): Promise<boolean> {
		try {
			const decoded = jwt.verify(
				token,
				secrets.EMAIL_2FA_KEY
			) as JwtPayload;

			if (!decoded || typeof decoded.email2FACode !== 'string') {
				logger.warn(
					'Invalid token structure during email 2FA verification'
				);
				return false;
			}

			// ensure the decoded 2FA code matches the one provided
			return decoded.email2FACode === email2FACode;
		} catch (err) {
			if (err instanceof jwt.JsonWebTokenError) {
				logger.warn(`
					JWT error during email 2FA verification: ${err.message}`);
			} else {
				logger.error(
					`Error verifying email 2FA code: ${err instanceof Error ? err.message : String(err)}`
				);
			}
			return false;
		}
	}

	return {
		generateEmail2FACode,
		verifyEmail2FACode
	};
}
