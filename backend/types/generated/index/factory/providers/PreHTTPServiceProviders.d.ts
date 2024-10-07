import { MailerServiceInterface, MulterUploadServiceInterface } from '../../interfaces/main';
export declare class MailerServiceProvider {
    private static instance;
    static getMailerService(): Promise<MailerServiceInterface>;
}
export declare class MulterUploadServiceProvider {
    private static instance;
    static getMulterUploadService(): Promise<MulterUploadServiceInterface>;
}
//# sourceMappingURL=PreHTTPServiceProviders.d.ts.map