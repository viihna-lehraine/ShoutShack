import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Logger } from '../utils/logger';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';

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
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'getSecrets', instance: getSecrets },
			{ name: 'bcrypt', instance: bcrypt },
			{ name: 'jwt', instance: jwt }
		],
		logger
	);

	let secrets: Secrets;

	try {
		secrets = await getSecrets();

		if (!secrets.EMAIL_2FA_KEY) {
			const error = new Error('Missing EMAIL_2FA_KEY in secrets');
			processError(error, logger);
			throw error;
		}
	} catch (err) {
		processError(err, logger);
		logger.error(
			'Email 2FA functionality will not work. Secrets could not be loaded.'
		);
		throw new Error('Failed to load secrets for email 2FA');
	}

	async function generateEmail2FACode(): Promise<{
		email2FACode: string;
		email2FAToken: string;
	}> {
		try {
			const email2FACode = await bcrypt.genSalt(6); // generates a 6-character salt (2FA code)
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
			processError(err, logger);
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

			// ensure the decoded 2FA code matches the provided 2FA code
			return decoded.email2FACode === email2FACode;
		} catch (err) {
			if (err instanceof jwt.JsonWebTokenError) {
				logger.warn(
					`JWT error during email 2FA verification: ${err.message}`
				);
			} else {
				processError(err, logger);
			}
			return false;
		}
	}

	return {
		generateEmail2FACode,
		verifyEmail2FACode
	};
}
