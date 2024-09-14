import QRCode from 'qrcode';
import { Logger } from '../utils/logger';
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
export default function createTOTPUtil({ speakeasy, QRCode, logger }: TOTPUtilDependencies): {
    generateTOTPSecret: () => TOTPSecret;
    generateTOTPToken: (secret: string) => string;
    verifyTOTPToken: (secret: string, token: string) => boolean;
    generateQRCode: (otpauth_url: string) => Promise<string>;
};
export {};
//# sourceMappingURL=totpUtil.d.ts.map
