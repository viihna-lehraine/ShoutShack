import { YubClientInterface, YubicoOTPOptionsInterface, YubicoOTPServiceInterface } from '../index/interfaces/main';
import '../../types/custom/yub.js';
export declare class YubicoOTPService implements YubicoOTPServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private vault;
    private cacheService;
    private yubClient;
    private ttl;
    private yub;
    private constructor();
    static getInstance(): Promise<YubicoOTPService>;
    private initializeYubClient;
    init(clientId: string, secretKey: string): YubClientInterface;
    initializeYubicoOTP(): Promise<void>;
    validateYubicoOTP(otp: string): Promise<boolean>;
    generateYubicoOTPOptions(): Promise<YubicoOTPOptionsInterface>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=YubicoOTP.d.ts.map