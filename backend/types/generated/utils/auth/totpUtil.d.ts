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
export default function createTOTPUtil({ speakeasy, QRCode }: TOTPUtilDependencies): {
    generateTOTPSecret: () => TOTPSecret;
    generateTOTPToken: (secret: string) => string;
    verifyTOTPToken: (secret: string, token: string) => boolean;
    generateQRCode: (otpauth_url: string) => Promise<string>;
};
export {};
//# sourceMappingURL=totpUtil.d.ts.map