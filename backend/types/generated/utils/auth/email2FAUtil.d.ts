declare function generateEmail2FACode(): Promise<{
    email2FACode: string;
    email2FAToken: string;
}>;
declare function verifyEmail2FACode(token: string, email2FACode: string): Promise<boolean>;
export { generateEmail2FACode, verifyEmail2FACode };
//# sourceMappingURL=email2FAUtil.d.ts.map