import { YubicoOTPServiceInterface } from '../index/interfaces/services';
import { YubClientInterface, YubicoOTPOptionsInterface } from '../index/interfaces/serviceComponents';
import '../../types/custom/yub.js';
export declare class YubicoOTPService implements YubicoOTPServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private secrets;
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