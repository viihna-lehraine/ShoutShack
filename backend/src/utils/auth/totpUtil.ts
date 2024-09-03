import QRCode from 'qrcode';
import { Logger, setupLogger } from '../../config/logger';

interface TOTPSecret {
	ascii: string;
	hex: string;
	base32: string;
	otpauth_url: string;
}

interface TOTPUtilDependencies {
	speakeasy: typeof import('speakeasy');
	QRCode: typeof QRCode;
}

export default function createTOTPUtil({
	speakeasy,
	QRCode
}: TOTPUtilDependencies): {
	generateTOTPSecret: () => TOTPSecret;
	generateTOTPToken: (secret: string) => string;
	verifyTOTPToken: (secret: string, token: string) => boolean;
	generateQRCode: (otpauth_url: string) => Promise<string>;
} {
	const logger: Logger = setupLogger();

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
		} catch (error) {
			logger.error(
				'Failed to generate TOTP secret.',
				error instanceof Error ? { stack: error.stack } : {}
			);
			throw new Error(
				`Failed to generate TOTP secret: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
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
		} catch (error) {
			logger.debug(
				'Failed to generate TOTP token.',
				error instanceof Error ? { stack: error.stack } : {}
			);
			throw new Error(
				`Failed to generate TOTP token: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	function verifyTOTPToken(secret: string, token: string): boolean {
		try {
			logger.debug('Verifying TOTP token.');
			const isTOTPTokenValid = speakeasy.totp.verify({
				secret,
				encoding: 'base32',
				token,
				window: 1 // gives leeway for clock drift
			});
			logger.debug(
				`TOTP token verification ${
					isTOTPTokenValid ? 'succeeded' : 'failed'
				}.`
			);
			return isTOTPTokenValid;
		} catch (error) {
			logger.debug(
				'Failed to verify TOTP token.',
				error instanceof Error ? { stack: error.stack } : {}
			);
			throw new Error(
				`Failed to verify TOTP token: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	async function generateQRCode(otpauth_url: string): Promise<string> {
		try {
			logger.debug('Generating QR code for TOTP.');
			const qrCode = await QRCode.toDataURL(otpauth_url);
			logger.debug('QR code generated successfully.');
			return qrCode;
		} catch (error) {
			logger.error(
				'Failed to generate QR code.',
				error instanceof Error ? { stack: error.stack } : {}
			);
			throw new Error(
				`Failed to generate QR code: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	return {
		generateTOTPSecret,
		generateTOTPToken,
		verifyTOTPToken,
		generateQRCode
	};
}
