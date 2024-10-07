import {
	AppLoggerServiceInterface,
	CacheServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	TOTPSecretInterface,
	TOTPServiceInterface
} from '../index/interfaces/main';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { serviceTTLConfig } from '../config/cache';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory';

export class TOTPService implements TOTPServiceInterface {
	private static instance: TOTPService | null = null;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private cacheService: CacheServiceInterface;

	private ttl: number;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		cacheService: CacheServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.cacheService = cacheService;
		this.ttl = serviceTTLConfig.TOTPService || serviceTTLConfig.default;
	}

	public static async getInstance(): Promise<TOTPService> {
		if (!TOTPService.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const cacheService =
				await CacheLayerServiceFactory.getCacheService();

			TOTPService.instance = new TOTPService(
				logger,
				errorLogger,
				errorHandler,
				cacheService
			);
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

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down TOTPService...');

			this.logger.info('Clearing TOTPService cache...');
			await this.cacheService.clearNamespace('TOTPService');
			this.logger.info('TOTPService cache cleared successfully.');

			TOTPService.instance = null;

			this.logger.info('TOTPService shutdown completed successfully.');
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during TOTPService shutdown: ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}
}
