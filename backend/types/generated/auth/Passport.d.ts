import { PassportServiceInterface } from '../index/interfaces/main';
export declare class PassportService implements PassportServiceInterface {
    private static instance;
    private passwordService;
    private logger;
    private errorLogger;
    private errorHandler;
    private vault;
    private constructor();
    static getInstance(): Promise<PassportService>;
    configurePassport(passport: import('passport').PassportStatic, UserModel: typeof import('../models/User').User): Promise<void>;
    shutdown(): Promise<void>;
    private handlePassportAuthServiceError;
}
//# sourceMappingURL=Passport.d.ts.map