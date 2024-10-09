import { EmailMFAServiceInterface } from '../index/interfaces/main';
import { EmailMFAServiceDeps } from '../index/interfaces/main';
export declare class EmailMFAService implements EmailMFAServiceInterface {
    private static instance;
    private cacheService;
    private logger;
    private errorLogger;
    private errorHandler;
    private vault;
    private constructor();
    static getInstance(): Promise<EmailMFAService>;
    generateEmailMFACode({ bcrypt, jwt }: EmailMFAServiceDeps): Promise<{
        emailMFACode: string;
        emailMFAToken: string;
    }>;
    verifyEmailMFACode(email: string, submittedCode: string): Promise<boolean>;
    shutdown(): Promise<void>;
    protected loadJwt(): Promise<EmailMFAServiceDeps['jwt']>;
}
//# sourceMappingURL=EmailMFA.d.ts.map