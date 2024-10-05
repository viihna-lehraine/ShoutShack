import { TOTPServiceInterface } from '../index/interfaces/services';
import { TOTPSecretInterface } from '../index/interfaces/serviceComponents';
export declare class TOTPService implements TOTPServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private cacheService;
    private ttl;
    private constructor();
    static getInstance(): Promise<TOTPService>;
    generateTOTPSecret(length?: number): TOTPSecretInterface;
    generateTOTPToken(secret: string): Promise<string>;
    verifyTOTPToken(secret: string, token: string, window?: number): boolean;
    generateQRCode(otpauth_url: string): Promise<string>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=TOTP.d.ts.map