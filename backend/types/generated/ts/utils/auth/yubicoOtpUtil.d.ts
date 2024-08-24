import '../../../types/custom/yub.d.ts';
declare function validateYubicoOTP(otp: string): Promise<boolean>;
declare function generateYubicoOtpOptions(): {
	clientId: number;
	apiKey: string;
	apiUrl: string;
};
export { generateYubicoOtpOptions, validateYubicoOTP };
//# sourceMappingURL=yubicoOtpUtil.d.ts.map
