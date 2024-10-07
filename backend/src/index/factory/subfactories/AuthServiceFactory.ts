import {
	BackupCodeServiceProvider,
	EmailMFAServiceProvider,
	FIDO2ServiceProvider,
	JWTServiceProvider,
	PasswordServiceProvider,
	TOTPServiceProvider,
	YubicoOTPServiceProvider
} from '../providers/AuthServiceProviders';
import * as Interfaces from '../../interfaces/main';

export class AuthServiceFactory {
	public static async getBackupCodeService(): Promise<Interfaces.BackupCodeServiceInterface> {
		return await BackupCodeServiceProvider.getBackupCodeService();
	}

	public static async getEmailMFAService(): Promise<Interfaces.EmailMFAServiceInterface> {
		return await EmailMFAServiceProvider.getEmailMFAService();
	}

	public static async getFIDO2Service(): Promise<Interfaces.FIDO2ServiceInterface> {
		return await FIDO2ServiceProvider.getFIDO2Service();
	}

	public static async getJWTService(): Promise<Interfaces.JWTServiceInterface> {
		return await JWTServiceProvider.getJWTService();
	}

	public static async getPasswordService(): Promise<Interfaces.PasswordServiceInterface> {
		return await PasswordServiceProvider.getPasswordService();
	}

	public static async getTOTPService(): Promise<Interfaces.TOTPServiceInterface> {
		return await TOTPServiceProvider.getTOTPService();
	}

	public static async getYubicoOTPService(): Promise<Interfaces.YubicoOTPServiceInterface> {
		return await YubicoOTPServiceProvider.getYubicoOTPService();
	}
}
