import {
	AppLoggerServiceInterface,
	BackupCodeServiceInterface,
	ErrorLoggerServiceInterface,
	ErrorHandlerServiceInterface
} from '../index/interfaces/services';
import { BackupCodeInterface } from '../index/interfaces/serviceComponents';
import { validateDependencies } from '../utils/helpers';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserMFA } from '../models/UserMFA';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';

export class BackupCodeService implements BackupCodeServiceInterface {
	private static instance: BackupCodeService | null = null;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
	}

	public static async getInstance(): Promise<BackupCodeService> {
		if (!BackupCodeService.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();

			BackupCodeService.instance = new BackupCodeService(
				logger,
				errorLogger,
				errorHandler
			);
		}
		return BackupCodeService.instance;
	}

	public async generateBackupCodes(id: string): Promise<string[]> {
		try {
			validateDependencies([{ name: 'id', instance: id }], this.logger);

			const backupCodes: BackupCodeInterface[] = [];
			for (let i = 0; i < 16; i++) {
				const code = crypto.randomBytes(4).toString('hex');
				const hashedCode = await bcrypt.hash(code, 10);
				backupCodes.push({ code: hashedCode, used: false });
			}

			await this.saveBackupCodesToDatabase(id, backupCodes);

			return backupCodes.map(backupCode => backupCode.code);
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return [''];
		}
	}

	public async verifyBackupCode(
		id: string,
		inputCode: string
	): Promise<boolean> {
		try {
			validateDependencies(
				[
					{ name: 'id', instance: id },
					{ name: 'inputCode', instance: inputCode }
				],
				this.logger
			);

			const storedCodes = await this.getBackupCodesFromDatabase(id);

			if (!storedCodes || storedCodes.length === 0) {
				this.logger.info(`No backup codes found for user ${id}`);
				return false;
			}

			for (const storedCode of storedCodes) {
				const match = await bcrypt.compare(inputCode, storedCode.code);
				if (match && !storedCode.used) {
					storedCode.used = true;
					await this.updateBackupCodesInDatabase(id, storedCodes);
					return true;
				}
			}

			this.logger.debug(`Backup code verification failed for user ${id}`);
			return false;
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.DependencyErrorRecoverable(
					`Failed to verify backup code for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return false;
		}
	}

	public async saveBackupCodesToDatabase(
		id: string,
		backupCodes: BackupCodeInterface[]
	): Promise<void> {
		try {
			validateDependencies(
				[
					{ name: 'id', instance: id },
					{ name: 'backupCodes', instance: backupCodes }
				],
				this.logger
			);

			const user = await UserMFA.findByPk(id);

			if (!user) {
				this.logger.warn(`User with ID ${id} not found`);
				return;
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to save backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}

	public async getBackupCodesFromDatabase(
		id: string
	): Promise<BackupCodeInterface[] | undefined> {
		try {
			validateDependencies([{ name: 'id', instance: id }], this.logger);

			const user = await UserMFA.findByPk(id);

			if (!user || !user.backupCodes) {
				this.logger.warn(`No backup codes found for user ${id}`);
				return;
			}

			return user.backupCodes.map(
				code => ({ code, used: false }) as BackupCodeInterface
			);
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to get backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return [];
		}
	}

	public async updateBackupCodesInDatabase(
		id: string,
		backupCodes: BackupCodeInterface[]
	): Promise<void> {
		try {
			validateDependencies(
				[
					{ name: 'id', instance: id },
					{ name: 'backupCodes', instance: backupCodes }
				],
				this.logger
			);

			const user = await UserMFA.findByPk(id);

			if (!user) {
				this.logger.warn(`User with ID ${id} not found`);
				return;
			}

			const backupCodesAsStrings = backupCodes.map(
				codeObj => codeObj.code
			);
			user.backupCodes = backupCodesAsStrings;
			await user.save();
		} catch (utilError) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to update backup codes for user ${id}: ${utilError instanceof Error ? utilError.message : utilError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down BackupCodeService...');

			BackupCodeService.instance = null;

			this.logger.info('BackupCodeService shutdown successfully.');
		} catch (error) {
			this.errorLogger.logError(
				`Error shutting down BackupCodeService: ${error instanceof Error ? error.message : error}`
			);
		}
	}
}
