import { TOTPSecretInterface, TOTPServiceInterface } from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { serviceTTLConfig } from '../config/cache';

export class TOTPService implements TOTPServiceInterface {
	private static instance: TOTPService | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private cacheService = ServiceFactory.getCacheService();
	private ttl = serviceTTLConfig.TOTPService || serviceTTLConfig.default;

	private constructor() {}

	public static getInstance(): TOTPService {
		if (!TOTPService.instance) {
			TOTPService.instance = new TOTPService();
		}

		return TOTPService.instance;
	}

	public generateTOTPSecret(length = 20): TOTPSecretInterface {
		try {
			this.logger.debug('Generating TOTP secret.');
			const totpSecret = speakeasy.generateSecret({ length });
			this.logger.debug('TOTP secret generated successfully.');

			return {
				ascii: totpSecret.ascii || '',
				hex: totpSecret.hex || '',
				base32: totpSecret.base32 || '',
				otpauth_url: totpSecret.otpauth_url || ''
			};
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate TOTP secret: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logWarn(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return {
				ascii: '',
				hex: '',
				base32: '',
				otpauth_url: ''
			};
		}
	}

	public async generateTOTPToken(secret: string): Promise<string> {
		try {
			const cacheKey = `totpToken:${secret}`;
			const cachedToken = await this.cacheService.get<string>(
				cacheKey,
				'auth'
			);

			if (cachedToken) {
				this.logger.debug('Returning cached TOTP token.');
				return cachedToken;
			}

			this.logger.debug('Generating new TOTP token.');
			const totpToken = speakeasy.totp({
				secret,
				encoding: 'base32'
			});

			await this.cacheService.set(cacheKey, totpToken, 'auth', this.ttl);

			this.logger.debug('TOTP token generated and cached successfully.');
			return totpToken;
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate TOTP token: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logWarn(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });

			return '';
		}
	}

	public verifyTOTPToken(secret: string, token: string, window = 1): boolean {
		try {
			this.logger.debug('Verifying TOTP token.');
			const isTOTPTokenValid = speakeasy.totp.verify({
				secret,
				encoding: 'base32',
				token,
				window
			});
			this.logger.debug(
				`TOTP token verification ${isTOTPTokenValid ? 'succeeded' : 'failed'}.`
			);
			return isTOTPTokenValid;
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to verify TOTP token: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logWarn(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return false;
		}
	}

	public async generateQRCode(otpauth_url: string): Promise<string> {
		try {
			this.logger.debug(
				`Generating QR code for TOTP with URL: ${otpauth_url}`
			);
			const qrCode = await QRCode.toDataURL(otpauth_url);
			this.logger.debug('QR code generated successfully.');
			return qrCode;
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate QR code for URL ${otpauth_url}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logWarn(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return '';
		}
	}
}
