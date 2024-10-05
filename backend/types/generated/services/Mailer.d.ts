import { Transporter } from 'nodemailer';
import { MailerServiceDeps } from '../index/interfaces/serviceDeps';
import { MailerServiceInterface } from '../index/interfaces/services';
export declare class MailerService implements MailerServiceInterface {
    private nodemailer;
    private emailUser;
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private vault;
    private transporter;
    private constructor();
    static getInstance(deps: MailerServiceDeps): Promise<MailerService>;
    validateMailerDependencies(): void;
    createMailTransporter(): Promise<Transporter>;
    getTransporter(): Promise<Transporter>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=Mailer.d.ts.map