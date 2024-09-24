import { TOTPMFA, TOTPSecretInterface } from '../index/interfaces';
import { validateDependencies } from '../utils/helpers';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';

export function createTOTPUtil({ speakeasy, QRCode }: TOTPMFA): {
	generateTOTPSecret: () => TOTPSecretInterface;
	generateTOTPToken: (secret: string) => string;
	verifyTOTPToken: (secret: string, token: string) => boolean;
	generateQRCode: (otpauth_url: string) => Promise<string>;
} {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	validateDependencies(
		[
			{ name: 'speakeasy', instance: speakeasy },
			{ name: 'QRCode', instance: QRCode }
		],
		logger
	);

	function generateTOTPSecret(): TOTPSecretInterface {
		try {
			logger.debug('Generating TOTP secret.');
			const totpSecret = speakeasy.generateSecret({ length: 20 });
			logger.debug('TOTP secret generated successfully.');
			return {
				ascii: totpSecret.ascii || '',
				hex: totpSecret.hex || '',
				base32: totpSecret.base32 || '',
				otpauth_url: totpSecret.otpauth_url || ''
			};
		} catch (utilError) {
			const utility: string = 'generateTOTPSecret()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate TOTP secret in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Returning object containing empty strings in lieu of 'ascii', 'hex', 'base32', and 'otpauth_url'`,
					{ exposeToClient: false }
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return {
				ascii: '',
				hex: '',
				base32: '',
				otpauth_url: ''
			};
		}
	}

	function generateTOTPToken(secret: string): string {
		try {
			logger.debug('Generating TOTP token.');
			const totpToken = speakeasy.totp({
				secret,
				encoding: 'base32'
			});
			logger.debug('TOTP token generated successfully.');
			return totpToken;
		} catch (utilError) {
			const utility: string = 'generateTOTPToken()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate TOTP token in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Returning empty string in lieu of TOTP token`,
					{ exposeToClient: false }
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return '';
		}
	}

	function verifyTOTPToken(secret: string, token: string): boolean {
		try {
			logger.debug('Verifying TOTP token.');
			const isTOTPTokenValid = speakeasy.totp.verify({
				secret,
				encoding: 'base32',
				token,
				window: 1
			});
			logger.debug(
				`TOTP token verification ${isTOTPTokenValid ? 'succeeded' : 'failed'}.`
			);
			return isTOTPTokenValid;
		} catch (utilError) {
			const utility: string = 'verifyTOTPToken()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to verify TOTP token in ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return false;
		}
	}

	async function generateQRCode(otpauth_url: string): Promise<string> {
		try {
			logger.debug('Generating QR code for TOTP.');
			const qrCode = await QRCode.toDataURL(otpauth_url);
			logger.debug('QR code generated successfully.');
			return qrCode;
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate QR code in 'generateQRCode()': ${utilError instanceof Error ? utilError.message : utilError} ; Returning empty string in lieu of QR code`,
					{ exposeToClient: false }
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return '';
		}
	}

	return {
		generateTOTPSecret,
		generateTOTPToken,
		verifyTOTPToken,
		generateQRCode
	};
}
