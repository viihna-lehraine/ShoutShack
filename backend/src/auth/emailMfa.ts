import { JwtPayload } from 'jsonwebtoken';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';
import {
	AppLoggerServiceInterface,
	EmailMFAInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface
} from '../index/interfaces';
import { SecretsStore } from '../services/secrets';

const logger = ServiceFactory.getLoggerService() as AppLoggerServiceInterface;
const errorLogger =
	ServiceFactory.getErrorLoggerService() as ErrorLoggerServiceInterface;
const errorHandler =
	ServiceFactory.getErrorHandlerService() as ErrorHandlerServiceInterface;
const secrets = ServiceFactory.getSecretsStore() as SecretsStore;

export async function createEmail2FAUtil({
	bcrypt,
	jwt
}: EmailMFAInterface): Promise<{
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
			{ name: 'bcrypt', instance: bcrypt },
			{ name: 'jwt', instance: jwt }
		],
		logger
	);

	async function generateEmail2FACode(): Promise<{
		email2FACode: string;
		email2FAToken: string;
	}> {
		try {
			const email2FACode = await bcrypt.genSalt(6);
			const email2FAToken = jwt.sign(
				{ email2FACode },
				secrets.retrieveSecret('EMAIL_2FA_KEY')!,
				{
					expiresIn: '30m'
				}
			);

			return {
				email2FACode,
				email2FAToken
			};
		} catch (utilError) {
			const utility: string = 'generateEmail2FACode()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured with ${utility}. Failed to generate email 2FA code: ${utilError instanceof Error ? utilError.message : utilError}`
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return {
				email2FACode: '',
				email2FAToken: ''
			};
		} finally {
			secrets.reEncryptSecret('EMAIL_2FA_KEY');
		}
	}

	async function verifyEmail2FACode(
		token: string,
		email2FACode: string
	): Promise<boolean> {
		try {
			const decoded = jwt.verify(
				token,
				secrets.retrieveSecret('EMAIL_2FA_KEY')!
			) as JwtPayload;

			if (!decoded || typeof decoded.email2FACode !== 'string') {
				logger.warn(
					'Invalid token structure during email 2FA verification'
				);
				return false;
			}

			return decoded.email2FACode === email2FACode;
		} catch (utilError) {
			const utility: string = 'verifyEmail2FACode()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured with dependency ${utility}. Failed to verify email 2FA code: ${utilError instanceof Error ? utilError.message : utilError}`
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return false;
		} finally {
			secrets.reEncryptSecret('EMAIL_2FA_KEY');
		}
	}

	return {
		generateEmail2FACode,
		verifyEmail2FACode
	};
}
