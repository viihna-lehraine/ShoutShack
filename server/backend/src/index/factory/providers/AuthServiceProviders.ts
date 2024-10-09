import { BackupCodeService } from '../../../auth/BackupCode';
import { EmailMFAService } from '../../../auth/EmailMFA';
import { FIDO2Service } from '../../../auth/FIDO2';
import { JWTService } from '../../../auth/JWT';
import { PasswordService } from '../../../auth/Password';
import { TOTPService } from '../../../auth/TOTP';
import { YubicoOTPService } from '../../../auth/YubicoOTP';
import {
	BackupCodeServiceInterface,
	EmailMFAServiceInterface,
	FIDO2ServiceInterface,
	JWTServiceInterface,
	PasswordServiceInterface,
	TOTPServiceInterface,
	YubicoOTPServiceInterface
} from '../../interfaces/main';

export class BackupCodeServiceProvider {
	private static instance: BackupCodeServiceInterface | null = null;

	public static async getBackupCodeService(): Promise<BackupCodeServiceInterface> {
		if (!this.instance) {
			this.instance = await BackupCodeService.getInstance();
		}
		return this.instance;
	}
}

export class EmailMFAServiceProvider {
	private static instance: EmailMFAServiceInterface | null = null;

	public static async getEmailMFAService(): Promise<EmailMFAServiceInterface> {
		if (!this.instance) {
			this.instance = await EmailMFAService.getInstance();
		}
		return this.instance;
	}
}

export class FIDO2ServiceProvider {
	private static instance: FIDO2ServiceInterface | null = null;

	public static async getFIDO2Service(): Promise<FIDO2ServiceInterface> {
		if (!this.instance) {
			this.instance = await FIDO2Service.getInstance();
		}
		return this.instance;
	}
}

export class JWTServiceProvider {
	private static instance: JWTServiceInterface | null = null;

	public static async getJWTService(): Promise<JWTServiceInterface> {
		if (!this.instance) {
			this.instance = await JWTService.getInstance();
		}
		return this.instance;
	}
}

export class PasswordServiceProvider {
	private static instance: PasswordServiceInterface | null = null;

	public static async getPasswordService(): Promise<PasswordServiceInterface> {
		if (!this.instance) {
			this.instance = await PasswordService.getInstance();
		}
		return this.instance;
	}
}

export class TOTPServiceProvider {
	private static instance: TOTPServiceInterface | null = null;

	public static async getTOTPService(): Promise<TOTPServiceInterface> {
		if (!this.instance) {
			this.instance = await TOTPService.getInstance();
		}
		return this.instance;
	}
}

export class YubicoOTPServiceProvider {
	private static instance: YubicoOTPServiceInterface | null = null;

	public static async getYubicoOTPService(): Promise<YubicoOTPServiceInterface> {
		if (!this.instance) {
			this.instance = await YubicoOTPService.getInstance();
		}
		return this.instance;
	}
}
