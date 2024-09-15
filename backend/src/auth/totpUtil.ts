import QRCode from 'qrcode';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

interface TOTPSecret {
	ascii: string;
	hex: string;
	base32: string;
	otpauth_url: string;
}

interface TOTPUtilDependencies {
	speakeasy: typeof import('speakeasy');
	QRCode: typeof QRCode;
	logger: Logger;
}

export function createTOTPUtil({
	speakeasy,
	QRCode,
	logger
}: TOTPUtilDependencies): {
	generateTOTPSecret: () => TOTPSecret;
	generateTOTPToken: (secret: string) => string;
	verifyTOTPToken: (secret: string, token: string) => boolean;
	generateQRCode: (otpauth_url: string) => Promise<string>;
} {
	validateDependencies(
		[
			{ name: 'speakeasy', instance: speakeasy },
			{ name: 'QRCode', instance: QRCode }
		],
		logger
	);

	function generateTOTPSecret(): TOTPSecret {
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
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to generate TOTP secret in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Returning object containing empty strings in lieu of 'ascii', 'hex', 'base32', and 'otpauth_url'`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
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
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to generate TOTP token in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Returning empty string in lieu of TOTP token`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
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
				window: 1 // leeway for clock drift
			});
			logger.debug(
				`TOTP token verification ${isTOTPTokenValid ? 'succeeded' : 'failed'}.`
			);
			return isTOTPTokenValid;
		} catch (utilError) {
			const utility: string = 'verifyTOTPToken()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to verify TOTP token in ${utility}: ${utilError instanceof Error ? utilError.message : utilError}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
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
			const utility: string = 'generateQRCode()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to generate QR code in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Returning empty string in lieu of QR code`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
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
