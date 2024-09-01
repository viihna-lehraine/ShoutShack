import nodemailer, { Transporter } from 'nodemailer';
export interface MailerSecrets {
    EMAIL_HOST: string;
    EMAIL_PORT: number;
    EMAIL_SECURE: boolean;
    SMTP_TOKEN: string;
}
export interface MailerDependencies {
    nodemailer: typeof nodemailer;
    getSecrets: () => Promise<MailerSecrets>;
    emailUser: string;
}
export declare function getTransporter(deps: MailerDependencies): Promise<Transporter>;
//# sourceMappingURL=mailer.d.ts.map