import * as Interfaces from '../interfaces/main';
export declare class PreHTTPSFactory {
    private static mailerService;
    private static multerUploadService;
    static getMailerService(): Promise<Interfaces.MailerServiceInterface>;
    static getMulterUploadService(): Promise<Interfaces.MulterUploadServiceInterface>;
}
//# sourceMappingURL=PreHTTPSFactory.d.ts.map
