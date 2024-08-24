interface TOTPSecret {
	ascii: string;
	hex: string;
	base32: string;
	otpauth_url: string;
}
declare function generateTOTPSecret(): TOTPSecret;
declare function generateTOTPToken(secret: string): string;
declare function verifyTOTPToken(secret: string, token: string): boolean;
declare function generateQRCode(otpauth_url: string): Promise<string>;
export {
	generateTOTPSecret,
	generateTOTPToken,
	verifyTOTPToken,
	generateQRCode
};
//# sourceMappingURL=totpUtil.d.ts.map
