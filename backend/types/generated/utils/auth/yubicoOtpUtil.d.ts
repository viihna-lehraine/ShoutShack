import '../../../types/custom/yub.d.ts';
interface YubicoOtpOptions {
    clientId: number;
    apiKey: string;
    apiUrl: string;
}
declare function validateYubicoOTP(otp: string): Promise<boolean>;
declare function generateYubicoOtpOptions(): YubicoOtpOptions;
export { generateYubicoOtpOptions, validateYubicoOTP };
//# sourceMappingURL=yubicoOtpUtil.d.ts.map