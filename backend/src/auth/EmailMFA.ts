import {
	AppLoggerServiceInterface,
	CacheServiceInterface,
	EmailMFAServiceInterface,
	ErrorLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	VaultServiceInterface
} from '../index/interfaces/main';
import { EmailMFAServiceDeps } from '../index/interfaces/main';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { VaultServiceFactory } from '../index/factory/subfactories/VaultServiceFactory';
import { JwtPayload } from 'jsonwebtoken';

export class EmailMFAService implements EmailMFAServiceInterface {
	private static instance: EmailMFAService | null = null;
	private cacheService!: CacheServiceInterface;
	private logger!: AppLoggerServiceInterface;
	private errorLogger!: ErrorLoggerServiceInterface;
	private errorHandler!: ErrorHandlerServiceInterface;
	private vault!: VaultServiceInterface;

	private constructor() {}

	public static async getInstance(): Promise<EmailMFAService> {
		if (!EmailMFAService.instance) {
			const cacheService =
				await CacheLayerServiceFactory.getCacheService();
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const vault = await VaultServiceFactory.getVaultService();

			EmailMFAService.instance = new EmailMFAService();
			EmailMFAService.instance.cacheService = cacheService;
			EmailMFAService.instance.logger = logger;
			EmailMFAService.instance.errorLogger = errorLogger;
			EmailMFAService.instance.errorHandler = errorHandler;
			EmailMFAService.instance.vault = vault;
		}

		return EmailMFAService.instance;
	}

	public async generateEmailMFACode({
		bcrypt,
		jwt
	}: EmailMFAServiceDeps): Promise<{
		emailMFACode: string;
		emailMFAToken: string;
	}> {
		try {
			const emailMFACode = await bcrypt.genSalt(6);
			const key = await this.vault.retrieveSecret(
				'EMAIL_MFA_KEY',
				secret => secret
			);

			if (typeof key !== 'string') {
				this.logger.warn(
					'Valid Email MFA key not found during email 2FA code generation'
				);
				return { emailMFACode: '', emailMFAToken: '' };
			}

			const emailMFAToken = jwt.sign({ emailMFACode }, key, {
				expiresIn: '30m'
			});

			return { emailMFACode, emailMFAToken };
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error generating email 2FA code: ${
						utilError instanceof Error
							? utilError.message
							: utilError
					}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });

			return { emailMFACode: '', emailMFAToken: '' };
		}
	}

	public async verifyEmailMFACode(
		email: string,
		submittedCode: string
	): Promise<boolean> {
		try {
			const cachedToken = await this.cacheService.get<string>(
				`mfaToken:${email}`,
				'auth'
			);

			if (!cachedToken) {
				this.logger.warn(
					`MFA token not found or expired for email: ${email}`
				);
				throw new this.errorHandler.ErrorClasses.InvalidInputError(
					'MFA token expired or invalid'
				);
			}

			const jwt = await this.loadJwt();
			const emailMFAKey = await this.vault.retrieveSecret(
				'EMAIL_MFA_KEY',
				secret => secret
			);

			if (!emailMFAKey) {
				this.logger.warn(
					'Valid Email MFA key not found during email 2FA code verification'
				);
				return false;
			}

			const decodedToken = jwt.verify(
				cachedToken,
				emailMFAKey
			) as JwtPayload;

			if (
				!decodedToken ||
				typeof decodedToken.emailMFACode !== 'string'
			) {
				this.logger.warn(
					`Invalid token structure during MFA verification for email: ${email}`
				);
				return false;
			}

			if (decodedToken.emailMFACode !== submittedCode) {
				this.logger.warn(`Invalid MFA code for email: ${email}`);
				return false;
			}

			await this.cacheService.del(`mfaToken:${email}`, 'auth');
			this.logger.info(`MFA verification successful for email: ${email}`);

			return true;
		} catch (error) {
			this.logger.error(`Error verifying MFA for email: ${email}`, {
				error
			});
			throw error;
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Clearing MFA tokens from cache...');
			await this.cacheService.clearNamespace('auth');

			EmailMFAService.instance = null;

			this.logger.info('EmailMFAService shutdown successfully.');
		} catch (error) {
			this.errorLogger.logError(
				`Error shutting down EmailMFAService: ${error instanceof Error ? error.message : error}`
			);
		}
	}

	protected async loadJwt(): Promise<EmailMFAServiceDeps['jwt']> {
		return (await import('jsonwebtoken')).default;
	}
}
