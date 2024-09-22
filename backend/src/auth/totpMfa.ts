import { TOTPMFA, TOTPSecret } from '../interfaces/authInterfaces';

export function createTOTPUtil({ speakeasy, QRCode }: TOTPMFA): {
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
		appLogger
	);

	function generateTOTPSecret(): TOTPSecret {
		try {
			appLogger.debug('Generating TOTP secret.');
			const totpSecret = speakeasy.generateSecret({ length: 20 });
			appLogger.debug('TOTP secret generated successfully.');
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
			ErrorLogger.logWarning(utilityError.message, appLogger);
			processError(utilityError, appLogger);
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
			appLogger.debug('Generating TOTP token.');
			const totpToken = speakeasy.totp({
				secret,
				encoding: 'base32'
			});
			appLogger.debug('TOTP token generated successfully.');
			return totpToken;
		} catch (utilError) {
			const utility: string = 'generateTOTPToken()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to generate TOTP token in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Returning empty string in lieu of TOTP token`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, appLogger);
			processError(utilityError, appLogger);
			return '';
		}
	}

	function verifyTOTPToken(secret: string, token: string): boolean {
		try {
			appLogger.debug('Verifying TOTP token.');
			const isTOTPTokenValid = speakeasy.totp.verify({
				secret,
				encoding: 'base32',
				token,
				window: 1 // leeway for clock drift
			});
			appLogger.debug(
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
			ErrorLogger.logWarning(utilityError.message, appLogger);
			processError(utilityError, appLogger);
			return false;
		}
	}

	async function generateQRCode(otpauth_url: string): Promise<string> {
		try {
			appLogger.debug('Generating QR code for TOTP.');
			const qrCode = await QRCode.toDataURL(otpauth_url);
			appLogger.debug('QR code generated successfully.');
			return qrCode;
		} catch (utilError) {
			const utility: string = 'generateQRCode()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to generate QR code in ${utility}: ${utilError instanceof Error ? utilError.message : utilError} ; Returning empty string in lieu of QR code`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, appLogger);
			processError(utilityError, appLogger);
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
