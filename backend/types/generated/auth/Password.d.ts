import { PasswordServiceInterface } from '../index/interfaces/services';
export declare class PasswordService implements PasswordServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private secrets;
    private constructor();
    static getInstance(): Promise<PasswordService>;
    hashPassword(password: string): Promise<string>;
    comparePassword(storedPassword: string, providedPassword: string): Promise<boolean>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=Password.d.ts.map