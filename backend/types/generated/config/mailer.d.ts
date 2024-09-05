import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from './logger';
export interface MailerSecrets {
    readonly EMAIL_HOST: string;
    readonly EMAIL_PORT: number;
    readonly EMAIL_SECURE: boolean;
    readonly SMTP_TOKEN: string;
}
export interface MailerDependencies {
    readonly nodemailer: typeof nodemailer;
    readonly getSecrets: () => Promise<MailerSecrets>;
    readonly emailUser: string;
    readonly logger: Logger;
}
export declare function getTransporter(deps: MailerDependencies): Promise<Transporter>;
//# sourceMappingURL=mailer.d.ts.map