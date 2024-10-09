import {
	MailerServiceInterface,
	MulterUploadServiceInterface
} from '../../interfaces/main';
import {
	MailerServiceProvider,
	MulterUploadServiceProvider
} from '../providers/PreHTTPServiceProviders';

export class PreHTTPSFactory {
	public static async getMailerService(): Promise<MailerServiceInterface> {
		return await MailerServiceProvider.getMailerService();
	}

	public static async getMulterUploadService(): Promise<MulterUploadServiceInterface> {
		return await MulterUploadServiceProvider.getMulterUploadService();
	}
}
