import { JwtPayload } from 'jsonwebtoken';
import { EmailMFA } from '../interfaces/authInterfaces';

export async function createEmail2FAUtil({ bcrypt, jwt }: EmailMFA): Promise<{
	generateEmail2FACode: () => Promise<{
		email2FACode: string;
		email2FAToken: string;
	}>;
	verifyEmail2FACode: (
		token: string,
		email2FACode: string
	) => Promise<boolean>;
}> {
	const appLogger = configService.getLogger();

	validateDependencies(
		[
			{ name: 'bcrypt', instance: bcrypt },
			{ name: 'jwt', instance: jwt }
		],
		appLogger || console
	);

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
		} catch (utilError) {
			const utility: string = 'generateEmail2FACode()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured with ${utility}. Failed to generate email 2FA code: ${utilError instanceof Error ? utilError.message : utilError}`
			);
			ErrorLogger.logError(utilityError);
			processError(utilityError);
			return {
				email2FACode: '',
				email2FAToken: ''
			};
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
				appLogger.warn(
					'Invalid token structure during email 2FA verification'
				);
				return false;
			}

			return decoded.email2FACode === email2FACode;
		} catch (utilError) {
			const utility: string = 'verifyEmail2FACode()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occured with dependency ${utility}. Failed to verify email 2FA code: ${utilError instanceof Error ? utilError.message : utilError}`
			);
			ErrorLogger.logError(utilityError);
			processError(utilityError);
			return false;
		}
	}

	return {
		generateEmail2FACode,
		verifyEmail2FACode
	};
}
