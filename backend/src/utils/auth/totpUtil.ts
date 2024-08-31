import QRCode from 'qrcode';

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
	function generateTOTPSecret(): TOTPSecret {
		const totpSecret = speakeasy.generateSecret({ length: 20 });
		return {
			ascii: totpSecret.ascii || '',
			hex: totpSecret.hex || '',
			base32: totpSecret.base32 || '',
			otpauth_url: totpSecret.otpauth_url || ''
		};
	}

	function generateTOTPToken(secret: string): string {
		const totpToken = speakeasy.totp({
			secret,
			encoding: 'base32'
		});
		return totpToken;
	}

	function verifyTOTPToken(secret: string, token: string): boolean {
		const isTOTPTokenValid = speakeasy.totp.verify({
			secret,
			encoding: 'base32',
			token,
			window: 1 // gives leeway for clock drift
		});
		return isTOTPTokenValid;
	}

	async function generateQRCode(otpauth_url: string): Promise<string> {
		return await QRCode.toDataURL(otpauth_url);
	}

	return {
		generateTOTPSecret,
		generateTOTPToken,
		verifyTOTPToken,
		generateQRCode
	};
}
