import { PasswordServiceInterface } from '../index/interfaces/services';
import { hashConfig } from '../config/security';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

export class PasswordService implements PasswordServiceInterface {
	private static instance: PasswordService | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private secrets = ServiceFactory.getVaultService();

	private constructor() {}

	public static getInstance(): PasswordService {
		if (!PasswordService.instance) {
			PasswordService.instance = new PasswordService();
		}
		return PasswordService.instance;
	}

	public async hashPassword(password: string): Promise<string> {
		try {
			validateDependencies(
				[{ name: 'password', instance: password }],
				this.logger || console
			);

			const pepper = this.secrets.retrieveSecret(
				'PEPPER',
				secret => secret
			);
			if (!pepper || typeof pepper !== 'string') {
				const hashConfigError =
					new this.errorHandler.ErrorClasses.ConfigurationError(
						`Unable to retrieve pepper from secrets. Password cannot be hashed.`,
						{ exposeToClient: false }
					);
				this.errorLogger.logError(hashConfigError.message);
				this.errorHandler.handleError({ error: hashConfigError });
				this.logger.error('Failed to retrieve pepper from secrets');
				throw hashConfigError;
			}

			return await (
				await import('argon2')
			).hash(password + pepper, hashConfig);
		} catch (hashUtilError) {
			const hashUtilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`${hashUtilError instanceof Error ? hashUtilError.message : hashUtilError}`
				);
			this.errorLogger.logError(hashUtilityError.message);
			this.errorHandler.handleError({ error: hashUtilityError });
			return '';
		} finally {
			this.logger.debug('Password hashed successfully');
		}
	}

	public async comparePassword(
		storedPassword: string,
		providedPassword: string
	): Promise<boolean> {
		try {
			const pepper = this.secrets.retrieveSecret(
				'PEPPER',
				secret => secret
			);
			if (!pepper || typeof pepper !== 'string') {
				this.logger.error(
					'Failed to retrieve pepper from secrets for password comparison'
				);
				throw new Error('Internal server error');
			}

			return await (
				await import('argon2')
			).verify(storedPassword, providedPassword + pepper);
		} catch (compareError) {
			this.errorHandler.handleError({
				error: compareError,
				action: 'comparePassword'
			});
			return false;
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down PasswordService...');

			PasswordService.instance = null;

			this.logger.info('PasswordService shutdown completed successfully');
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during PasswordService shutdown: ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}
}
