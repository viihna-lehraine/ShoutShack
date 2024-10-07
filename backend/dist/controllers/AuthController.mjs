import { validateDependencies } from '../utils/helpers.mjs';
import { createUserModel } from '../models/User.mjs';
import { generateEmailMFATemplate } from '../templates/emailMFACodeTemplate.mjs';
import passport from 'passport';
import { serviceTTLConfig } from '../config/cache.mjs';
import { AuthServiceFactory } from '../index/factory/subfactories/AuthServiceFactory.mjs';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory.mjs';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory.mjs';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory.mjs';
import { MiddlewareFactory } from '../index/factory/subfactories/MiddlewareFactory.mjs';
import { VaultServiceFactory } from '../index/factory/subfactories/VaultServiceFactory.mjs';
import { UserControllerFactory } from '../index/factory/subfactories/UserControllerFactory.mjs';
import { PassportServiceFactory } from '../index/factory/subfactories/PassportServiceFactory.mjs';
import { PreHTTPSFactory } from '../index/factory/subfactories/PreHTTPSFactory.mjs';
import { DatabaseControllerFactory } from '../index/factory/subfactories/DatabaseControllerFactory.mjs';
export class AuthController {
	static instance = null;
	backupCodeService;
	emailMFAService;
	JWTAuthMiddlewareService;
	JWTService;
	passportAuthService;
	passportAuthMiddlewareService;
	passwordService;
	TOTPService;
	UserController;
	cacheService;
	logger;
	errorLogger;
	errorHandler;
	vault;
	mailer;
	sequelize;
	constructor(
		backupCodeService,
		emailMFAService,
		JWTAuthMiddlewareService,
		JWTService,
		passportAuthService,
		passportAuthMiddlewareService,
		passwordService,
		TOTPService,
		UserController,
		cacheService,
		logger,
		errorLogger,
		errorHandler,
		vault,
		mailer,
		sequelize
	) {
		this.backupCodeService = backupCodeService;
		this.emailMFAService = emailMFAService;
		this.JWTAuthMiddlewareService = JWTAuthMiddlewareService;
		this.JWTService = JWTService;
		this.passportAuthService = passportAuthService;
		this.passportAuthMiddlewareService = passportAuthMiddlewareService;
		this.passwordService = passwordService;
		this.TOTPService = TOTPService;
		this.UserController = UserController;
		this.cacheService = cacheService;
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.vault = vault;
		this.mailer = mailer;
		this.sequelize = sequelize;
	}
	static async getInstance() {
		if (!AuthController.instance) {
			const backupCodeService =
				await AuthServiceFactory.getBackupCodeService();
			const emailMFAService =
				await AuthServiceFactory.getEmailMFAService();
			const JWTAuthMiddlewareService =
				await MiddlewareFactory.getJWTAuthMiddleware();
			const JWTService = await AuthServiceFactory.getJWTService();
			const passportAuthService =
				await PassportServiceFactory.getPassportService();
			const passportAuthMiddlewareService =
				await MiddlewareFactory.getPassportAuthMiddleware();
			const passwordService =
				await AuthServiceFactory.getPasswordService();
			const TOTPService = await AuthServiceFactory.getTOTPService();
			const UserController =
				await UserControllerFactory.getUserController();
			const cacheService =
				await CacheLayerServiceFactory.getCacheService();
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const vault = await VaultServiceFactory.getVaultService();
			const mailer = await PreHTTPSFactory.getMailerService();
			const databaseController =
				await DatabaseControllerFactory.getDatabaseController();
			const sequelize = databaseController.getSequelizeInstance();
			AuthController.instance = new AuthController(
				backupCodeService,
				emailMFAService,
				JWTAuthMiddlewareService,
				JWTService,
				passportAuthService,
				passportAuthMiddlewareService,
				passwordService,
				TOTPService,
				UserController,
				cacheService,
				logger,
				errorLogger,
				errorHandler,
				vault,
				mailer,
				sequelize
			);
		}
		return AuthController.instance;
	}
	async initializeAuthMiddleware() {
		if (!this.sequelize) {
			throw new Error('Sequelize instance is not available');
		}
		const UserModel = await createUserModel();
		await this.passportAuthService.configurePassport(passport, UserModel);
	}
	initializeJWTAuthMiddleware() {
		return this.JWTAuthMiddlewareService.initializeJWTAuthMiddleware();
	}
	initializePassportAuthMiddleware() {
		return this.passportAuthMiddlewareService.initializePassportAuthMiddleware(
			{
				passport,
				authenticateOptions: { session: false },
				validateDependencies
			}
		);
	}
	async findUserById(userId) {
		try {
			const user = await this.UserController.findUserById(userId);
			if (!user) {
				this.errorLogger.logError(`User with ID ${userId} not found`);
				throw new Error('User not found');
			}
			return user;
		} catch (err) {
			this.handleAuthControllerError(
				err,
				'FIND_USER_ERROR',
				{
					userId
				},
				'Error finding user by ID'
			);
			return null;
		}
	}
	async findUserByEmail(email) {
		try {
			const user = await this.UserController.findUserByEmail(email);
			if (!user) throw new Error('User not found');
			return user;
		} catch (error) {
			this.handleAuthControllerError(
				error,
				'FIND_USER_EMAIL_ERROR',
				{ email },
				'Error finding user by email'
			);
			return null;
		}
	}
	async loginUser(email, password) {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					'User not found'
				);
			}
			const argon2 = await this.loadArgon2();
			const pepper = await this.vault.retrieveSecret(
				'PEPPER',
				secret => secret
			);
			const isMatch = await argon2.verify(
				user.password,
				password + pepper
			);
			if (!isMatch) {
				throw new this.errorHandler.ErrorClasses.InvalidInputError(
					'Incorrect password'
				);
			}
			if (user.isMFAEnabled) {
				const mfaResult = await this.handleMFAForLogin(user);
				return { success: true, requiresMFA: mfaResult };
			}
			const token = await this.JWTService.generateJWT(
				String(user.userId),
				user.username
			);
			await this.cacheService.set(
				`authToken:${user.userId}`,
				token,
				'auth',
				serviceTTLConfig.JWTService || serviceTTLConfig.default
			);
			return { success: true, token };
		} catch (error) {
			this.logger.error('Login failed', { error });
			throw error;
		}
	}
	async authenticateUser(userId, password) {
		try {
			const user = await this.findUserById(userId);
			if (!user) return false;
			return await this.comparePassword(user, password);
		} catch (error) {
			this.handleAuthControllerError(
				error,
				'AUTHENTICATE_USER_ERROR',
				{ userId },
				'Error authenticating user'
			);
			return false;
		}
	}
	async handleMFAForLogin(user) {
		const bcrypt = await this.loadBcrypt();
		const jwt = await this.loadJwt();
		const { emailMFACode, emailMFAToken } =
			await this.emailMFAService.generateEmailMFACode({ bcrypt, jwt });
		await this.cacheService.set(
			`mfaToken:${user.email}`,
			emailMFAToken,
			'auth',
			1800
		);
		const emailTemplate = generateEmailMFATemplate(
			user.username,
			emailMFACode
		);
		const transporter = await this.mailer.getTransporter();
		await transporter.sendMail({
			to: user.email,
			subject: 'Your Login Code',
			html: emailTemplate
		});
		return true;
	}
	async recoverPassword(email) {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				this.logger.warn(
					`Password recovery attempted for non-existent email: ${email}`
				);
				if (process.env.NODE_ENV === 'production') {
					return;
				} else {
					throw new this.errorHandler.ErrorClasses.MissingResourceError(
						'User not found'
					);
				}
			}
			const resetToken = await this.loadUuidv4();
			user.resetPasswordToken = resetToken;
			user.resetPasswordExpires = new Date(Date.now() + 1800000);
			await user.save();
			await this.cacheService.set(
				`resetToken:${user.email}`,
				resetToken,
				'auth',
				serviceTTLConfig.ResetToken || 1800
			);
			const transporter = await this.mailer.getTransporter();
			await transporter.sendMail({
				to: user.email,
				subject: 'Password Reset Request',
				text: `Here is your password reset token: ${resetToken}. It expires in 30 minutes.`
			});
			this.logger.info(`Password reset email sent to ${user.email}`);
		} catch (error) {
			this.errorLogger.logError(
				`Error in password recovery for ${email}: ${String(error)}`
			);
			this.errorHandler.handleError({ error, details: { email } });
			throw new this.errorHandler.ErrorClasses.ServiceUnavailableError(
				10,
				'Password recovery failed. Please try again later.'
			);
		}
	}
	async resetPassword(user, newPassword) {
		try {
			const pepper = await this.vault.retrieveSecret(
				'PEPPER',
				secret => secret
			);
			if (!pepper) {
				throw new this.errorHandler.ErrorClasses.AppAuthenticationError(
					'PEPPER could not be found'
				);
			}
			const hashedPassword = await this.passwordService.hashPassword(
				newPassword,
				pepper
			);
			user.password = hashedPassword;
			user.resetPasswordToken = null;
			user.resetPasswordExpires = null;
			await user.save();
			this.logger.info(
				`Password reset successfully for user ${user.username}`
			);
			return user;
		} catch (error) {
			this.logger.error(
				`Error resetting password for user ${user.username}: ${error}`
			);
			this.errorHandler.handleError({ error, action: 'resetPassword' });
			return null;
		}
	}
	async generateResetToken(user) {
		try {
			const resetToken = await this.loadUuidv4();
			user.resetPasswordToken = resetToken;
			user.resetPasswordExpires = new Date(Date.now() + 3600000);
			await user.save();
			await this.cacheService.set(
				`resetToken:${user.userId}`,
				resetToken,
				'auth',
				serviceTTLConfig.ResetToken || 3600
			);
			this.logger.info(`Reset token generated for user ${user.username}`);
			return resetToken;
		} catch (error) {
			this.errorHandler.handleError({
				error,
				action: 'generateResetToken',
				details: { userId: user.userId }
			});
			this.logger.error(
				`Failed to generate reset token for user ${user.username}`
			);
			return null;
		}
	}
	async validateResetToken(userId, token) {
		const user = await this.findUserById(userId);
		if (!user) {
			this.logger.warn(`User with ID ${userId} not found`);
			return null;
		}
		if (user.resetPasswordToken !== token) {
			this.logger.warn(`Invalid reset token for user ${userId}`);
			return null;
		}
		if (
			!user.resetPasswordExpires ||
			user.resetPasswordExpires <= new Date()
		) {
			this.logger.warn(`Expired reset token for user ${userId}`);
			return null;
		}
		return user;
	}
	async enableMfa(userId) {
		try {
			const user = await this.UserController.findOne({
				id: userId
			});
			if (!user) {
				this.logger.warn(`User with ID ${userId} not found`);
				return false;
			}
			user.isMFAEnabled = true;
			await user.save();
			this.logger.info(`MFA enabled for user ${user.username}`);
			return true;
		} catch (error) {
			this.logger.error(
				`Error enabling MFA for user ${userId}: ${error}`
			);
			return false;
		}
	}
	async disableMfa(userId) {
		try {
			const user = await this.UserController.findOne({
				id: userId
			});
			if (!user) {
				this.logger.warn(`User with ID ${userId} not found`);
				return false;
			}
			user.isMFAEnabled = false;
			await user.save();
			this.logger.info(`MFA disabled for user ${user.username}`);
			return true;
		} catch (error) {
			this.logger.error(
				`Error disabling MFA for user ${userId}: ${error}`
			);
			return false;
		}
	}
	async generateBackupCodesForUser(userId) {
		try {
			const user = await this.UserController.findUserById(userId);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.ClientAuthenticationError(
					`User with ID ${userId} not found`
				);
			}
			const backupCodes =
				await this.backupCodeService.generateBackupCodes(userId);
			return backupCodes;
		} catch (error) {
			this.logger.error(
				`Error generating backup codes for user ${userId}: ${error}`
			);
			this.errorHandler.handleError({ error });
			throw error;
		}
	}
	async verifyBackupCodeForUser(userId, inputCode) {
		try {
			const result = await this.backupCodeService.verifyBackupCode(
				userId,
				inputCode
			);
			return result;
		} catch (error) {
			this.logger.error(
				`Error verifying backup code for user ${userId}: ${error}`
			);
			this.errorHandler.handleError({ error });
			throw error;
		}
	}
	async generateEmailMFACode(email) {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					'User not found'
				);
			}
			const { emailMFACode, emailMFAToken } =
				await this.emailMFAService.generateEmailMFACode({
					bcrypt: await this.loadBcrypt(),
					jwt: await this.loadJwt()
				});
			await this.cacheService.set(
				`mfaToken:${user.email}`,
				emailMFAToken,
				'auth',
				1800
			);
			const emailTemplate = generateEmailMFATemplate(
				user.username,
				emailMFACode
			);
			const transporter = await this.mailer.getTransporter();
			await transporter.sendMail({
				to: user.email,
				subject: 'Your Login Code',
				html: emailTemplate
			});
			this.logger.info(`MFA code sent to user: ${user.email}`);
			return true;
		} catch (error) {
			this.logger.error('Error generating Email MFA code', { error });
			throw error;
		}
	}
	async verifyEmailMFACode(email, emailMFACode) {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					'User not found'
				);
			}
			const jwt = await this.loadJwt();
			const isValid = await this.emailMFAService.verifyEmailMFACode(
				email,
				emailMFACode,
				jwt
			);
			if (!isValid) {
				throw new this.errorHandler.ErrorClasses.InvalidInputError(
					'Invalid MFA code'
				);
			}
			this.logger.info(
				`MFA verification successful for user: ${user.email}`
			);
			return true;
		} catch (error) {
			this.logger.error('Error verifying Email MFA', { error });
			throw error;
		}
	}
	async generateTOTP(userId) {
		try {
			const user = await this.findUserById(userId);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					`User with ID ${userId} not found`
				);
			}
			const { base32, otpauth_url } =
				this.TOTPService.generateTOTPSecret();
			const qrCodeUrl =
				await this.TOTPService.generateQRCode(otpauth_url);
			user.totpSecret = base32;
			await user.save();
			this.logger.info(`TOTP secret generated for user ${user.email}`);
			return { secret: base32, qrCodeUrl };
		} catch (error) {
			this.errorLogger.logError(
				`Error generating TOTP for user ${userId}: ${String(error)}`
			);
			this.errorHandler.handleError({ error, details: { userId } });
			throw new this.errorHandler.ErrorClasses.ServiceUnavailableError(
				10,
				'TOTP generation failed. Please try again.'
			);
		}
	}
	async verifyTOTP(userId, token) {
		try {
			const user = await this.findUserById(userId);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					`User with ID ${userId} not found`
				);
			}
			const sanitizedToken = token.trim();
			const isValid = this.TOTPService.verifyTOTPToken(
				user.totpSecret,
				sanitizedToken
			);
			if (isValid) {
				this.logger.info(
					`TOTP verified successfully for user ${user.email}`
				);
			} else {
				this.logger.warn(`Invalid TOTP token for user ${user.email}`);
			}
			return isValid;
		} catch (error) {
			this.errorLogger.logError(
				`Error verifying TOTP for user ${userId}: ${String(error)}`
			);
			this.errorHandler.handleError({
				error,
				details: { userId, token }
			});
			throw new this.errorHandler.ErrorClasses.ServiceUnavailableError(
				10,
				'TOTP verification failed. Please try again.'
			);
		}
	}
	async comparePassword(user, password) {
		try {
			const argon2 = await this.loadArgon2();
			const pepper = process.env.PEPPER;
			if (!pepper) {
				this.logger.error('PEPPER could not be found');
				throw new Error('Internal server error');
			}
			return await argon2.verify(user.password, password + pepper);
		} catch (error) {
			this.errorHandler.handleError({ error, action: 'comparePassword' });
			return false;
		}
	}
	async loadAxios() {
		return (await import('axios')).default;
	}
	async loadBcrypt() {
		return (await import('bcrypt')).default;
	}
	async loadArgon2() {
		return (await import('argon2')).default;
	}
	async loadJwt() {
		return (await import('jsonwebtoken')).default;
	}
	async loadUuidv4() {
		const { v4: uuidv4 } = await import('uuid');
		return uuidv4();
	}
	async loadZxcvbn() {
		return (await import('zxcvbn')).default;
	}
	async shutdown() {
		try {
			this.logger.info('Shutting down AuthController...');
			this.logger.info('Clearing AuthController cache...');
			await this.cacheService.clearNamespace('AuthController');
			this.logger.info('AuthController cache cleared successfully.');
			AuthController.instance = null;
			this.logger.info('AuthController shutdown completed successfully.');
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during AuthController shutdown: ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}
	handleAuthControllerError(error, errorHeader, errorDetails, customMessage) {
		try {
			const errorMessage = `${customMessage}: ${error}\n${error instanceof Error ? error.stack : ''}`;
			this.errorLogger.logError(errorMessage);
			const resourceError =
				new this.errorHandler.ErrorClasses.AuthControllerError(
					errorHeader,
					{
						details: errorDetails,
						exposeToClient: false
					}
				);
			this.errorHandler.handleError({
				error: resourceError
			});
		} catch (error) {
			this.logger.error(
				`Error handling resource manager error: ${error}`
			);
			const severity = this.errorHandler.ErrorSeverity.WARNING;
			this.errorHandler.handleError({
				error,
				details: {
					context: 'Auth Controller',
					action: 'Passing error from Auth Controller handler to ErrorHandlerService',
					notes: 'Error occurred while handling Auth Controller error: AuthController.handleAuthControllerError'
				},
				severity
			});
		}
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXV0aENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlcnMvQXV0aENvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBb0JBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RSxPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFFaEMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFbkQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sa0RBQWtELENBQUM7QUFDdEYsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sd0RBQXdELENBQUM7QUFDbEcsT0FBTyxFQUFFLDBCQUEwQixFQUFFLE1BQU0sMERBQTBELENBQUM7QUFDdEcsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sb0RBQW9ELENBQUM7QUFDMUYsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0saURBQWlELENBQUM7QUFDcEYsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sbURBQW1ELENBQUM7QUFDeEYsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0scURBQXFELENBQUM7QUFDNUYsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sc0RBQXNELENBQUM7QUFDOUYsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLCtDQUErQyxDQUFDO0FBQ2hGLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxNQUFNLHlEQUF5RCxDQUFDO0FBRXBHLE1BQU0sT0FBTyxjQUFjO0lBQ2xCLE1BQU0sQ0FBQyxRQUFRLEdBQTBCLElBQUksQ0FBQztJQUM5QyxpQkFBaUIsQ0FBNkI7SUFDOUMsZUFBZSxDQUEyQjtJQUMxQyx3QkFBd0IsQ0FB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LEdBQ2xCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQ3JELFdBQVcsRUFDWDtnQkFDQyxPQUFPLEVBQUUsWUFBWTtnQkFDckIsY0FBYyxFQUFFLEtBQUs7YUFDckIsQ0FDRCxDQUFDO1lBRUgsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7Z0JBQzdCLEtBQUssRUFBRSxhQUFhO2FBQ3BCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNoQiwwQ0FBMEMsS0FBSyxFQUFFLENBQ2pELENBQUM7WUFDRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDekQsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUM7Z0JBQzdCLEtBQUs7Z0JBQ0wsT0FBTyxFQUFFO29CQUNSLE9BQU8sRUFBRSxpQkFBaUI7b0JBQzFCLE1BQU0sRUFBRSxtRUFBbUU7b0JBQzNFLEtBQUssRUFBRSwrRkFBK0Y7aUJBQ3RHO2dCQUNELFFBQVE7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFVzZXJJbnN0YW5jZUludGVyZmFjZSB9IGZyb20gJy4uL2luZGV4L2ludGVyZmFjZXMvbW9kZWxzJztcbmltcG9ydCB7XG5cdEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEF1dGhDb250cm9sbGVySW50ZXJmYWNlLFxuXHRCYWNrdXBDb2RlU2VydmljZUludGVyZmFjZSxcblx0Q2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFbWFpbE1GQVNlcnZpY2VJbnRlcmZhY2UsXG5cdEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0SldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRKV1RTZXJ2aWNlSW50ZXJmYWNlLFxuXHRNYWlsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRQYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0UGFzc3BvcnRTZXJ2aWNlSW50ZXJmYWNlLFxuXHRQYXNzd29yZFNlcnZpY2VJbnRlcmZhY2UsXG5cdFRPVFBTZXJ2aWNlSW50ZXJmYWNlLFxuXHRVc2VyQ29udHJvbGxlckRlcHMsXG5cdFVzZXJDb250cm9sbGVySW50ZXJmYWNlLFxuXHRWYXVsdFNlcnZpY2VJbnRlcmZhY2Vcbn0gZnJvbSAnLi4vaW5kZXgvaW50ZXJmYWNlcy9tYWluJztcbmltcG9ydCB7IHZhbGlkYXRlRGVwZW5kZW5jaWVzIH0gZnJvbSAnLi4vdXRpbHMvaGVscGVycyc7XG5pbXBvcnQgeyBjcmVhdGVVc2VyTW9kZWwgfSBmcm9tICcuLi9tb2RlbHMvVXNlcic7XG5pbXBvcnQgeyBnZW5lcmF0ZUVtYWlsTUZBVGVtcGxhdGUgfSBmcm9tICcuLi90ZW1wbGF0ZXMvZW1haWxNRkFDb2RlVGVtcGxhdGUnO1xuaW1wb3J0IHBhc3Nwb3J0IGZyb20gJ3Bhc3Nwb3J0JztcbmltcG9ydCB7IFJlcXVlc3RIYW5kbGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBzZXJ2aWNlVFRMQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnL2NhY2hlJztcbmltcG9ydCB7IFNlcXVlbGl6ZSB9IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgeyBBdXRoU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9BdXRoU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvQ2FjaGVMYXllclNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IEVycm9ySGFuZGxlclNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvRXJyb3JIYW5kbGVyU2VydmljZUZhY3RvcnknO1xuaW1wb3J0IHsgTG9nZ2VyU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9Mb2dnZXJTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBNaWRkbGV3YXJlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL01pZGRsZXdhcmVGYWN0b3J5JztcbmltcG9ydCB7IFZhdWx0U2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9WYXVsdFNlcnZpY2VGYWN0b3J5JztcbmltcG9ydCB7IFVzZXJDb250cm9sbGVyRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL1VzZXJDb250cm9sbGVyRmFjdG9yeSc7XG5pbXBvcnQgeyBQYXNzcG9ydFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vaW5kZXgvZmFjdG9yeS9zdWJmYWN0b3JpZXMvUGFzc3BvcnRTZXJ2aWNlRmFjdG9yeSc7XG5pbXBvcnQgeyBQcmVIVFRQU0ZhY3RvcnkgfSBmcm9tICcuLi9pbmRleC9mYWN0b3J5L3N1YmZhY3Rvcmllcy9QcmVIVFRQU0ZhY3RvcnknO1xuaW1wb3J0IHsgRGF0YWJhc2VDb250cm9sbGVyRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3Rvcnkvc3ViZmFjdG9yaWVzL0RhdGFiYXNlQ29udHJvbGxlckZhY3RvcnknO1xuXG5leHBvcnQgY2xhc3MgQXV0aENvbnRyb2xsZXIgaW1wbGVtZW50cyBBdXRoQ29udHJvbGxlckludGVyZmFjZSB7XG5cdHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBBdXRoQ29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIGJhY2t1cENvZGVTZXJ2aWNlOiBCYWNrdXBDb2RlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBlbWFpbE1GQVNlcnZpY2U6IEVtYWlsTUZBU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2U6IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBKV1RTZXJ2aWNlOiBKV1RTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcml2YXRlIHBhc3Nwb3J0QXV0aFNlcnZpY2U6IFBhc3Nwb3J0U2VydmljZUludGVyZmFjZTtcblx0cHJpdmF0ZSBwYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZTogUGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgcGFzc3dvcmRTZXJ2aWNlOiBQYXNzd29yZFNlcnZpY2VJbnRlcmZhY2U7XG5cdHByaXZhdGUgVE9UUFNlcnZpY2U6IFRPVFBTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcm90ZWN0ZWQgVXNlckNvbnRyb2xsZXI6IFVzZXJDb250cm9sbGVySW50ZXJmYWNlO1xuXHRwcm90ZWN0ZWQgY2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2U7XG5cdHByb3RlY3RlZCBsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2U7XG5cdHByb3RlY3RlZCBlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcm90ZWN0ZWQgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJTZXJ2aWNlSW50ZXJmYWNlO1xuXHRwcm90ZWN0ZWQgdmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZTtcblx0cHJvdGVjdGVkIG1haWxlcjogTWFpbGVyU2VydmljZUludGVyZmFjZTtcblxuXHRwcml2YXRlIHNlcXVlbGl6ZTogU2VxdWVsaXplIHwgbnVsbDtcblxuXHRwcml2YXRlIGNvbnN0cnVjdG9yKFxuXHRcdGJhY2t1cENvZGVTZXJ2aWNlOiBCYWNrdXBDb2RlU2VydmljZUludGVyZmFjZSxcblx0XHRlbWFpbE1GQVNlcnZpY2U6IEVtYWlsTUZBU2VydmljZUludGVyZmFjZSxcblx0XHRKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2U6IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRKV1RTZXJ2aWNlOiBKV1RTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdHBhc3Nwb3J0QXV0aFNlcnZpY2U6IFBhc3Nwb3J0U2VydmljZUludGVyZmFjZSxcblx0XHRwYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZTogUGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0cGFzc3dvcmRTZXJ2aWNlOiBQYXNzd29yZFNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0VE9UUFNlcnZpY2U6IFRPVFBTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdFVzZXJDb250cm9sbGVyOiBVc2VyQ29udHJvbGxlckludGVyZmFjZSxcblx0XHRjYWNoZVNlcnZpY2U6IENhY2hlU2VydmljZUludGVyZmFjZSxcblx0XHRsb2dnZXI6IEFwcExvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0ZXJyb3JMb2dnZXI6IEVycm9yTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0dmF1bHQ6IFZhdWx0U2VydmljZUludGVyZmFjZSxcblx0XHRtYWlsZXI6IE1haWxlclNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0c2VxdWVsaXplOiBTZXF1ZWxpemUgfCBudWxsXG5cdCkge1xuXHRcdHRoaXMuYmFja3VwQ29kZVNlcnZpY2UgPSBiYWNrdXBDb2RlU2VydmljZTtcblx0XHR0aGlzLmVtYWlsTUZBU2VydmljZSA9IGVtYWlsTUZBU2VydmljZTtcblx0XHR0aGlzLkpXVEF1dGhNaWRkbGV3YXJlU2VydmljZSA9IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZTtcblx0XHR0aGlzLkpXVFNlcnZpY2UgPSBKV1RTZXJ2aWNlO1xuXHRcdHRoaXMucGFzc3BvcnRBdXRoU2VydmljZSA9IHBhc3Nwb3J0QXV0aFNlcnZpY2U7XG5cdFx0dGhpcy5wYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZSA9IHBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlO1xuXHRcdHRoaXMucGFzc3dvcmRTZXJ2aWNlID0gcGFzc3dvcmRTZXJ2aWNlO1xuXHRcdHRoaXMuVE9UUFNlcnZpY2UgPSBUT1RQU2VydmljZTtcblx0XHR0aGlzLlVzZXJDb250cm9sbGVyID0gVXNlckNvbnRyb2xsZXI7XG5cdFx0dGhpcy5jYWNoZVNlcnZpY2UgPSBjYWNoZVNlcnZpY2U7XG5cdFx0dGhpcy5sb2dnZXIgPSBsb2dnZXI7XG5cdFx0dGhpcy5lcnJvckxvZ2dlciA9IGVycm9yTG9nZ2VyO1xuXHRcdHRoaXMuZXJyb3JIYW5kbGVyID0gZXJyb3JIYW5kbGVyO1xuXHRcdHRoaXMudmF1bHQgPSB2YXVsdDtcblx0XHR0aGlzLm1haWxlciA9IG1haWxlcjtcblx0XHR0aGlzLnNlcXVlbGl6ZSA9IHNlcXVlbGl6ZTtcblx0fVxuXG5cdHB1YmxpYyBzdGF0aWMgYXN5bmMgZ2V0SW5zdGFuY2UoKTogUHJvbWlzZTxBdXRoQ29udHJvbGxlcj4ge1xuXHRcdGlmICghQXV0aENvbnRyb2xsZXIuaW5zdGFuY2UpIHtcblx0XHRcdGNvbnN0IGJhY2t1cENvZGVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldEJhY2t1cENvZGVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlbWFpbE1GQVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBBdXRoU2VydmljZUZhY3RvcnkuZ2V0RW1haWxNRkFTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBKV1RBdXRoTWlkZGxld2FyZVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBNaWRkbGV3YXJlRmFjdG9yeS5nZXRKV1RBdXRoTWlkZGxld2FyZSgpO1xuXHRcdFx0Y29uc3QgSldUU2VydmljZSA9IGF3YWl0IEF1dGhTZXJ2aWNlRmFjdG9yeS5nZXRKV1RTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBwYXNzcG9ydEF1dGhTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgUGFzc3BvcnRTZXJ2aWNlRmFjdG9yeS5nZXRQYXNzcG9ydFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IHBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgTWlkZGxld2FyZUZhY3RvcnkuZ2V0UGFzc3BvcnRBdXRoTWlkZGxld2FyZSgpO1xuXHRcdFx0Y29uc3QgcGFzc3dvcmRTZXJ2aWNlID1cblx0XHRcdFx0YXdhaXQgQXV0aFNlcnZpY2VGYWN0b3J5LmdldFBhc3N3b3JkU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgVE9UUFNlcnZpY2UgPSBhd2FpdCBBdXRoU2VydmljZUZhY3RvcnkuZ2V0VE9UUFNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IFVzZXJDb250cm9sbGVyID1cblx0XHRcdFx0YXdhaXQgVXNlckNvbnRyb2xsZXJGYWN0b3J5LmdldFVzZXJDb250cm9sbGVyKCk7XG5cdFx0XHRjb25zdCBjYWNoZVNlcnZpY2UgPVxuXHRcdFx0XHRhd2FpdCBDYWNoZUxheWVyU2VydmljZUZhY3RvcnkuZ2V0Q2FjaGVTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBsb2dnZXIgPSBhd2FpdCBMb2dnZXJTZXJ2aWNlRmFjdG9yeS5nZXRMb2dnZXJTZXJ2aWNlKCk7XG5cdFx0XHRjb25zdCBlcnJvckxvZ2dlciA9XG5cdFx0XHRcdGF3YWl0IExvZ2dlclNlcnZpY2VGYWN0b3J5LmdldEVycm9yTG9nZ2VyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgZXJyb3JIYW5kbGVyID1cblx0XHRcdFx0YXdhaXQgRXJyb3JIYW5kbGVyU2VydmljZUZhY3RvcnkuZ2V0RXJyb3JIYW5kbGVyU2VydmljZSgpO1xuXHRcdFx0Y29uc3QgdmF1bHQgPSBhd2FpdCBWYXVsdFNlcnZpY2VGYWN0b3J5LmdldFZhdWx0U2VydmljZSgpO1xuXHRcdFx0Y29uc3QgbWFpbGVyID0gYXdhaXQgUHJlSFRUUFNGYWN0b3J5LmdldE1haWxlclNlcnZpY2UoKTtcblx0XHRcdGNvbnN0IGRhdGFiYXNlQ29udHJvbGxlciA9XG5cdFx0XHRcdGF3YWl0IERhdGFiYXNlQ29udHJvbGxlckZhY3RvcnkuZ2V0RGF0YWJhc2VDb250cm9sbGVyKCk7XG5cdFx0XHRjb25zdCBzZXF1ZWxpemUgPSBkYXRhYmFzZUNvbnRyb2xsZXIuZ2V0U2VxdWVsaXplSW5zdGFuY2UoKTtcblxuXHRcdFx0QXV0aENvbnRyb2xsZXIuaW5zdGFuY2UgPSBuZXcgQXV0aENvbnRyb2xsZXIoXG5cdFx0XHRcdGJhY2t1cENvZGVTZXJ2aWNlLFxuXHRcdFx0XHRlbWFpbE1GQVNlcnZpY2UsXG5cdFx0XHRcdEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZSxcblx0XHRcdFx0SldUU2VydmljZSxcblx0XHRcdFx0cGFzc3BvcnRBdXRoU2VydmljZSxcblx0XHRcdFx0cGFzc3BvcnRBdXRoTWlkZGxld2FyZVNlcnZpY2UsXG5cdFx0XHRcdHBhc3N3b3JkU2VydmljZSxcblx0XHRcdFx0VE9UUFNlcnZpY2UsXG5cdFx0XHRcdFVzZXJDb250cm9sbGVyLFxuXHRcdFx0XHRjYWNoZVNlcnZpY2UsXG5cdFx0XHRcdGxvZ2dlcixcblx0XHRcdFx0ZXJyb3JMb2dnZXIsXG5cdFx0XHRcdGVycm9ySGFuZGxlcixcblx0XHRcdFx0dmF1bHQsXG5cdFx0XHRcdG1haWxlcixcblx0XHRcdFx0c2VxdWVsaXplXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBBdXRoQ29udHJvbGxlci5pbnN0YW5jZTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBpbml0aWFsaXplQXV0aE1pZGRsZXdhcmUoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLnNlcXVlbGl6ZSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdTZXF1ZWxpemUgaW5zdGFuY2UgaXMgbm90IGF2YWlsYWJsZScpO1xuXHRcdH1cblxuXHRcdGNvbnN0IFVzZXJNb2RlbCA9IGF3YWl0IGNyZWF0ZVVzZXJNb2RlbCgpO1xuXG5cdFx0YXdhaXQgdGhpcy5wYXNzcG9ydEF1dGhTZXJ2aWNlLmNvbmZpZ3VyZVBhc3Nwb3J0KHBhc3Nwb3J0LCBVc2VyTW9kZWwpO1xuXHR9XG5cblx0cHVibGljIGluaXRpYWxpemVKV1RBdXRoTWlkZGxld2FyZSgpOiBSZXF1ZXN0SGFuZGxlciB7XG5cdFx0cmV0dXJuIHRoaXMuSldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlLmluaXRpYWxpemVKV1RBdXRoTWlkZGxld2FyZSgpO1xuXHR9XG5cblx0cHVibGljIGluaXRpYWxpemVQYXNzcG9ydEF1dGhNaWRkbGV3YXJlKCk6IFJlcXVlc3RIYW5kbGVyIHtcblx0XHRyZXR1cm4gdGhpcy5wYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZS5pbml0aWFsaXplUGFzc3BvcnRBdXRoTWlkZGxld2FyZShcblx0XHRcdHtcblx0XHRcdFx0cGFzc3BvcnQsXG5cdFx0XHRcdGF1dGhlbnRpY2F0ZU9wdGlvbnM6IHsgc2Vzc2lvbjogZmFsc2UgfSxcblx0XHRcdFx0dmFsaWRhdGVEZXBlbmRlbmNpZXNcblx0XHRcdH1cblx0XHQpO1xuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIGZpbmRVc2VyQnlJZChcblx0XHR1c2VySWQ6IHN0cmluZ1xuXHQpOiBQcm9taXNlPFVzZXJJbnN0YW5jZUludGVyZmFjZSB8IG51bGw+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgdXNlciA9IGF3YWl0IHRoaXMuVXNlckNvbnRyb2xsZXIuZmluZFVzZXJCeUlkKHVzZXJJZCk7XG5cblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKGBVc2VyIHdpdGggSUQgJHt1c2VySWR9IG5vdCBmb3VuZGApO1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGZvdW5kJyk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1c2VyO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0dGhpcy5oYW5kbGVBdXRoQ29udHJvbGxlckVycm9yKFxuXHRcdFx0XHRlcnIsXG5cdFx0XHRcdCdGSU5EX1VTRVJfRVJST1InLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dXNlcklkXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCdFcnJvciBmaW5kaW5nIHVzZXIgYnkgSUQnXG5cdFx0XHQpO1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIGZpbmRVc2VyQnlFbWFpbChcblx0XHRlbWFpbDogc3RyaW5nXG5cdCk6IFByb21pc2U8VXNlckluc3RhbmNlSW50ZXJmYWNlIHwgbnVsbD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5Vc2VyQ29udHJvbGxlci5maW5kVXNlckJ5RW1haWwoZW1haWwpO1xuXHRcdFx0aWYgKCF1c2VyKSB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGZvdW5kJyk7XG5cdFx0XHRyZXR1cm4gdXNlcjtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5oYW5kbGVBdXRoQ29udHJvbGxlckVycm9yKFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0J0ZJTkRfVVNFUl9FTUFJTF9FUlJPUicsXG5cdFx0XHRcdHsgZW1haWwgfSxcblx0XHRcdFx0J0Vycm9yIGZpbmRpbmcgdXNlciBieSBlbWFpbCdcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgbG9naW5Vc2VyKFxuXHRcdGVtYWlsOiBzdHJpbmcsXG5cdFx0cGFzc3dvcmQ6IHN0cmluZ1xuXHQpOiBQcm9taXNlPHsgc3VjY2VzczogYm9vbGVhbjsgdG9rZW4/OiBzdHJpbmc7IHJlcXVpcmVzTUZBPzogYm9vbGVhbiB9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHVzZXIgPSBhd2FpdCB0aGlzLmZpbmRVc2VyQnlFbWFpbChlbWFpbCk7XG5cdFx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5NaXNzaW5nUmVzb3VyY2VFcnJvcihcblx0XHRcdFx0XHQnVXNlciBub3QgZm91bmQnXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGFyZ29uMiA9IGF3YWl0IHRoaXMubG9hZEFyZ29uMigpO1xuXHRcdFx0Y29uc3QgcGVwcGVyID0gYXdhaXQgdGhpcy52YXVsdC5yZXRyaWV2ZVNlY3JldChcblx0XHRcdFx0J1BFUFBFUicsXG5cdFx0XHRcdHNlY3JldCA9PiBzZWNyZXRcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBpc01hdGNoID0gYXdhaXQgYXJnb24yLnZlcmlmeShcblx0XHRcdFx0dXNlci5wYXNzd29yZCxcblx0XHRcdFx0cGFzc3dvcmQgKyBwZXBwZXJcblx0XHRcdCk7XG5cblx0XHRcdGlmICghaXNNYXRjaCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkludmFsaWRJbnB1dEVycm9yKFxuXHRcdFx0XHRcdCdJbmNvcnJlY3QgcGFzc3dvcmQnXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh1c2VyLmlzTUZBRW5hYmxlZCkge1xuXHRcdFx0XHRjb25zdCBtZmFSZXN1bHQgPSBhd2FpdCB0aGlzLmhhbmRsZU1GQUZvckxvZ2luKHVzZXIpO1xuXHRcdFx0XHRyZXR1cm4geyBzdWNjZXNzOiB0cnVlLCByZXF1aXJlc01GQTogbWZhUmVzdWx0IH07XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHRva2VuID0gYXdhaXQgdGhpcy5KV1RTZXJ2aWNlLmdlbmVyYXRlSldUKFxuXHRcdFx0XHRTdHJpbmcodXNlci51c2VySWQpLFxuXHRcdFx0XHR1c2VyLnVzZXJuYW1lXG5cdFx0XHQpO1xuXG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdGBhdXRoVG9rZW46JHt1c2VyLnVzZXJJZH1gLFxuXHRcdFx0XHR0b2tlbixcblx0XHRcdFx0J2F1dGgnLFxuXHRcdFx0XHRzZXJ2aWNlVFRMQ29uZmlnLkpXVFNlcnZpY2UgfHwgc2VydmljZVRUTENvbmZpZy5kZWZhdWx0XG5cdFx0XHQpO1xuXG5cdFx0XHRyZXR1cm4geyBzdWNjZXNzOiB0cnVlLCB0b2tlbiB9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcignTG9naW4gZmFpbGVkJywgeyBlcnJvciB9KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHByb3RlY3RlZCBhc3luYyBhdXRoZW50aWNhdGVVc2VyKFxuXHRcdHVzZXJJZDogc3RyaW5nLFxuXHRcdHBhc3N3b3JkOiBzdHJpbmdcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHVzZXIgPSBhd2FpdCB0aGlzLmZpbmRVc2VyQnlJZCh1c2VySWQpO1xuXHRcdFx0aWYgKCF1c2VyKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5jb21wYXJlUGFzc3dvcmQodXNlciwgcGFzc3dvcmQpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmhhbmRsZUF1dGhDb250cm9sbGVyRXJyb3IoXG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHQnQVVUSEVOVElDQVRFX1VTRVJfRVJST1InLFxuXHRcdFx0XHR7IHVzZXJJZCB9LFxuXHRcdFx0XHQnRXJyb3IgYXV0aGVudGljYXRpbmcgdXNlcidcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVNRkFGb3JMb2dpbihcblx0XHR1c2VyOiBVc2VySW5zdGFuY2VJbnRlcmZhY2Vcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3QgYmNyeXB0ID0gYXdhaXQgdGhpcy5sb2FkQmNyeXB0KCk7XG5cdFx0Y29uc3Qgand0ID0gYXdhaXQgdGhpcy5sb2FkSnd0KCk7XG5cblx0XHRjb25zdCB7IGVtYWlsTUZBQ29kZSwgZW1haWxNRkFUb2tlbiB9ID1cblx0XHRcdGF3YWl0IHRoaXMuZW1haWxNRkFTZXJ2aWNlLmdlbmVyYXRlRW1haWxNRkFDb2RlKHsgYmNyeXB0LCBqd3QgfSk7XG5cblx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRgbWZhVG9rZW46JHt1c2VyLmVtYWlsfWAsXG5cdFx0XHRlbWFpbE1GQVRva2VuLFxuXHRcdFx0J2F1dGgnLFxuXHRcdFx0MTgwMFxuXHRcdCk7XG5cblx0XHRjb25zdCBlbWFpbFRlbXBsYXRlID0gZ2VuZXJhdGVFbWFpbE1GQVRlbXBsYXRlKFxuXHRcdFx0dXNlci51c2VybmFtZSxcblx0XHRcdGVtYWlsTUZBQ29kZVxuXHRcdCk7XG5cdFx0Y29uc3QgdHJhbnNwb3J0ZXIgPSBhd2FpdCB0aGlzLm1haWxlci5nZXRUcmFuc3BvcnRlcigpO1xuXHRcdGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKHtcblx0XHRcdHRvOiB1c2VyLmVtYWlsLFxuXHRcdFx0c3ViamVjdDogJ1lvdXIgTG9naW4gQ29kZScsXG5cdFx0XHRodG1sOiBlbWFpbFRlbXBsYXRlXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyByZWNvdmVyUGFzc3dvcmQoZW1haWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5maW5kVXNlckJ5RW1haWwoZW1haWwpO1xuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0YFBhc3N3b3JkIHJlY292ZXJ5IGF0dGVtcHRlZCBmb3Igbm9uLWV4aXN0ZW50IGVtYWlsOiAke2VtYWlsfWBcblx0XHRcdFx0KTtcblx0XHRcdFx0aWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5NaXNzaW5nUmVzb3VyY2VFcnJvcihcblx0XHRcdFx0XHRcdCdVc2VyIG5vdCBmb3VuZCdcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJlc2V0VG9rZW4gPSBhd2FpdCB0aGlzLmxvYWRVdWlkdjQoKTtcblx0XHRcdHVzZXIucmVzZXRQYXNzd29yZFRva2VuID0gcmVzZXRUb2tlbjtcblx0XHRcdHVzZXIucmVzZXRQYXNzd29yZEV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgMTgwMDAwMCk7XG5cdFx0XHRhd2FpdCB1c2VyLnNhdmUoKTtcblxuXHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2Uuc2V0KFxuXHRcdFx0XHRgcmVzZXRUb2tlbjoke3VzZXIuZW1haWx9YCxcblx0XHRcdFx0cmVzZXRUb2tlbixcblx0XHRcdFx0J2F1dGgnLFxuXHRcdFx0XHRzZXJ2aWNlVFRMQ29uZmlnLlJlc2V0VG9rZW4gfHwgMTgwMFxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgdHJhbnNwb3J0ZXIgPSBhd2FpdCB0aGlzLm1haWxlci5nZXRUcmFuc3BvcnRlcigpO1xuXHRcdFx0YXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwoe1xuXHRcdFx0XHR0bzogdXNlci5lbWFpbCxcblx0XHRcdFx0c3ViamVjdDogJ1Bhc3N3b3JkIFJlc2V0IFJlcXVlc3QnLFxuXHRcdFx0XHR0ZXh0OiBgSGVyZSBpcyB5b3VyIHBhc3N3b3JkIHJlc2V0IHRva2VuOiAke3Jlc2V0VG9rZW59LiBJdCBleHBpcmVzIGluIDMwIG1pbnV0ZXMuYFxuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oYFBhc3N3b3JkIHJlc2V0IGVtYWlsIHNlbnQgdG8gJHt1c2VyLmVtYWlsfWApO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgaW4gcGFzc3dvcmQgcmVjb3ZlcnkgZm9yICR7ZW1haWx9OiAke1N0cmluZyhlcnJvcil9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3IsIGRldGFpbHM6IHsgZW1haWwgfSB9KTtcblx0XHRcdHRocm93IG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuU2VydmljZVVuYXZhaWxhYmxlRXJyb3IoXG5cdFx0XHRcdDEwLFxuXHRcdFx0XHQnUGFzc3dvcmQgcmVjb3ZlcnkgZmFpbGVkLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyLidcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIHJlc2V0UGFzc3dvcmQoXG5cdFx0dXNlcjogVXNlckluc3RhbmNlSW50ZXJmYWNlLFxuXHRcdG5ld1Bhc3N3b3JkOiBzdHJpbmdcblx0KTogUHJvbWlzZTxVc2VySW5zdGFuY2VJbnRlcmZhY2UgfCBudWxsPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHBlcHBlciA9IGF3YWl0IHRoaXMudmF1bHQucmV0cmlldmVTZWNyZXQoXG5cdFx0XHRcdCdQRVBQRVInLFxuXHRcdFx0XHRzZWNyZXQgPT4gc2VjcmV0XG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoIXBlcHBlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkFwcEF1dGhlbnRpY2F0aW9uRXJyb3IoXG5cdFx0XHRcdFx0J1BFUFBFUiBjb3VsZCBub3QgYmUgZm91bmQnXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGhhc2hlZFBhc3N3b3JkID0gYXdhaXQgdGhpcy5wYXNzd29yZFNlcnZpY2UuaGFzaFBhc3N3b3JkKFxuXHRcdFx0XHRuZXdQYXNzd29yZCxcblx0XHRcdFx0cGVwcGVyXG5cdFx0XHQpO1xuXHRcdFx0dXNlci5wYXNzd29yZCA9IGhhc2hlZFBhc3N3b3JkO1xuXG5cdFx0XHR1c2VyLnJlc2V0UGFzc3dvcmRUb2tlbiA9IG51bGw7XG5cdFx0XHR1c2VyLnJlc2V0UGFzc3dvcmRFeHBpcmVzID0gbnVsbDtcblxuXHRcdFx0YXdhaXQgdXNlci5zYXZlKCk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdGBQYXNzd29yZCByZXNldCBzdWNjZXNzZnVsbHkgZm9yIHVzZXIgJHt1c2VyLnVzZXJuYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gdXNlciBhcyBVc2VySW5zdGFuY2VJbnRlcmZhY2U7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgRXJyb3IgcmVzZXR0aW5nIHBhc3N3b3JkIGZvciB1c2VyICR7dXNlci51c2VybmFtZX06ICR7ZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3IsIGFjdGlvbjogJ3Jlc2V0UGFzc3dvcmQnIH0pO1xuXG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2VuZXJhdGVSZXNldFRva2VuKFxuXHRcdHVzZXI6IFVzZXJJbnN0YW5jZUludGVyZmFjZVxuXHQpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzZXRUb2tlbiA9IGF3YWl0IHRoaXMubG9hZFV1aWR2NCgpO1xuXHRcdFx0dXNlci5yZXNldFBhc3N3b3JkVG9rZW4gPSByZXNldFRva2VuO1xuXHRcdFx0dXNlci5yZXNldFBhc3N3b3JkRXhwaXJlcyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyAzNjAwMDAwKTtcblx0XHRcdGF3YWl0IHVzZXIuc2F2ZSgpO1xuXG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdGByZXNldFRva2VuOiR7dXNlci51c2VySWR9YCxcblx0XHRcdFx0cmVzZXRUb2tlbixcblx0XHRcdFx0J2F1dGgnLFxuXHRcdFx0XHRzZXJ2aWNlVFRMQ29uZmlnLlJlc2V0VG9rZW4gfHwgMzYwMFxuXHRcdFx0KTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgUmVzZXQgdG9rZW4gZ2VuZXJhdGVkIGZvciB1c2VyICR7dXNlci51c2VybmFtZX1gKTtcblx0XHRcdHJldHVybiByZXNldFRva2VuO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7XG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRhY3Rpb246ICdnZW5lcmF0ZVJlc2V0VG9rZW4nLFxuXHRcdFx0XHRkZXRhaWxzOiB7IHVzZXJJZDogdXNlci51c2VySWQgfVxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEZhaWxlZCB0byBnZW5lcmF0ZSByZXNldCB0b2tlbiBmb3IgdXNlciAke3VzZXIudXNlcm5hbWV9YFxuXHRcdFx0KTtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyB2YWxpZGF0ZVJlc2V0VG9rZW4oXG5cdFx0dXNlcklkOiBzdHJpbmcsXG5cdFx0dG9rZW46IHN0cmluZ1xuXHQpOiBQcm9taXNlPFVzZXJJbnN0YW5jZUludGVyZmFjZSB8IG51bGw+IHtcblx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5maW5kVXNlckJ5SWQodXNlcklkKTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihgVXNlciB3aXRoIElEICR7dXNlcklkfSBub3QgZm91bmRgKTtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdGlmICh1c2VyLnJlc2V0UGFzc3dvcmRUb2tlbiAhPT0gdG9rZW4pIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYEludmFsaWQgcmVzZXQgdG9rZW4gZm9yIHVzZXIgJHt1c2VySWR9YCk7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cblx0XHRpZiAoXG5cdFx0XHQhdXNlci5yZXNldFBhc3N3b3JkRXhwaXJlcyB8fFxuXHRcdFx0dXNlci5yZXNldFBhc3N3b3JkRXhwaXJlcyA8PSBuZXcgRGF0ZSgpXG5cdFx0KSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBFeHBpcmVkIHJlc2V0IHRva2VuIGZvciB1c2VyICR7dXNlcklkfWApO1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVzZXI7XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZW5hYmxlTWZhKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHVzZXIgPSBhd2FpdCB0aGlzLlVzZXJDb250cm9sbGVyLmZpbmRPbmUoe1xuXHRcdFx0XHRpZDogdXNlcklkXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYFVzZXIgd2l0aCBJRCAke3VzZXJJZH0gbm90IGZvdW5kYCk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dXNlci5pc01GQUVuYWJsZWQgPSB0cnVlO1xuXHRcdFx0YXdhaXQgdXNlci5zYXZlKCk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oYE1GQSBlbmFibGVkIGZvciB1c2VyICR7dXNlci51c2VybmFtZX1gKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGVuYWJsaW5nIE1GQSBmb3IgdXNlciAke3VzZXJJZH06ICR7ZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZGlzYWJsZU1mYSh1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5Vc2VyQ29udHJvbGxlci5maW5kT25lKHtcblx0XHRcdFx0aWQ6IHVzZXJJZFxuXHRcdFx0fSk7XG5cblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBVc2VyIHdpdGggSUQgJHt1c2VySWR9IG5vdCBmb3VuZGApO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHVzZXIuaXNNRkFFbmFibGVkID0gZmFsc2U7XG5cdFx0XHRhd2FpdCB1c2VyLnNhdmUoKTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgTUZBIGRpc2FibGVkIGZvciB1c2VyICR7dXNlci51c2VybmFtZX1gKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGRpc2FibGluZyBNRkEgZm9yIHVzZXIgJHt1c2VySWR9OiAke2Vycm9yfWBcblx0XHRcdCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIGdlbmVyYXRlQmFja3VwQ29kZXNGb3JVc2VyKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5Vc2VyQ29udHJvbGxlci5maW5kVXNlckJ5SWQodXNlcklkKTtcblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkNsaWVudEF1dGhlbnRpY2F0aW9uRXJyb3IoXG5cdFx0XHRcdFx0YFVzZXIgd2l0aCBJRCAke3VzZXJJZH0gbm90IGZvdW5kYFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBiYWNrdXBDb2RlcyA9XG5cdFx0XHRcdGF3YWl0IHRoaXMuYmFja3VwQ29kZVNlcnZpY2UuZ2VuZXJhdGVCYWNrdXBDb2Rlcyh1c2VySWQpO1xuXHRcdFx0cmV0dXJuIGJhY2t1cENvZGVzO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGdlbmVyYXRpbmcgYmFja3VwIGNvZGVzIGZvciB1c2VyICR7dXNlcklkfTogJHtlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoeyBlcnJvciB9KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyB2ZXJpZnlCYWNrdXBDb2RlRm9yVXNlcihcblx0XHR1c2VySWQ6IHN0cmluZyxcblx0XHRpbnB1dENvZGU6IHN0cmluZ1xuXHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5iYWNrdXBDb2RlU2VydmljZS52ZXJpZnlCYWNrdXBDb2RlKFxuXHRcdFx0XHR1c2VySWQsXG5cdFx0XHRcdGlucHV0Q29kZVxuXHRcdFx0KTtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgRXJyb3IgdmVyaWZ5aW5nIGJhY2t1cCBjb2RlIGZvciB1c2VyICR7dXNlcklkfTogJHtlcnJvcn1gXG5cdFx0XHQpO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoeyBlcnJvciB9KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBnZW5lcmF0ZUVtYWlsTUZBQ29kZShlbWFpbDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHVzZXIgPSBhd2FpdCB0aGlzLmZpbmRVc2VyQnlFbWFpbChlbWFpbCk7XG5cdFx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5NaXNzaW5nUmVzb3VyY2VFcnJvcihcblx0XHRcdFx0XHQnVXNlciBub3QgZm91bmQnXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHsgZW1haWxNRkFDb2RlLCBlbWFpbE1GQVRva2VuIH0gPVxuXHRcdFx0XHRhd2FpdCB0aGlzLmVtYWlsTUZBU2VydmljZS5nZW5lcmF0ZUVtYWlsTUZBQ29kZSh7XG5cdFx0XHRcdFx0YmNyeXB0OiBhd2FpdCB0aGlzLmxvYWRCY3J5cHQoKSxcblx0XHRcdFx0XHRqd3Q6IGF3YWl0IHRoaXMubG9hZEp3dCgpXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5zZXQoXG5cdFx0XHRcdGBtZmFUb2tlbjoke3VzZXIuZW1haWx9YCxcblx0XHRcdFx0ZW1haWxNRkFUb2tlbixcblx0XHRcdFx0J2F1dGgnLFxuXHRcdFx0XHQxODAwXG5cdFx0XHQpO1xuXG5cdFx0XHRjb25zdCBlbWFpbFRlbXBsYXRlID0gZ2VuZXJhdGVFbWFpbE1GQVRlbXBsYXRlKFxuXHRcdFx0XHR1c2VyLnVzZXJuYW1lLFxuXHRcdFx0XHRlbWFpbE1GQUNvZGVcblx0XHRcdCk7XG5cdFx0XHRjb25zdCB0cmFuc3BvcnRlciA9IGF3YWl0IHRoaXMubWFpbGVyLmdldFRyYW5zcG9ydGVyKCk7XG5cdFx0XHRhd2FpdCB0cmFuc3BvcnRlci5zZW5kTWFpbCh7XG5cdFx0XHRcdHRvOiB1c2VyLmVtYWlsLFxuXHRcdFx0XHRzdWJqZWN0OiAnWW91ciBMb2dpbiBDb2RlJyxcblx0XHRcdFx0aHRtbDogZW1haWxUZW1wbGF0ZVxuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oYE1GQSBjb2RlIHNlbnQgdG8gdXNlcjogJHt1c2VyLmVtYWlsfWApO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIEVtYWlsIE1GQSBjb2RlJywgeyBlcnJvciB9KTtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyB2ZXJpZnlFbWFpbE1GQUNvZGUoXG5cdFx0ZW1haWw6IHN0cmluZyxcblx0XHRlbWFpbE1GQUNvZGU6IHN0cmluZ1xuXHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgdXNlciA9IGF3YWl0IHRoaXMuZmluZFVzZXJCeUVtYWlsKGVtYWlsKTtcblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLk1pc3NpbmdSZXNvdXJjZUVycm9yKFxuXHRcdFx0XHRcdCdVc2VyIG5vdCBmb3VuZCdcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3Qgand0ID0gYXdhaXQgdGhpcy5sb2FkSnd0KCk7XG5cdFx0XHRjb25zdCBpc1ZhbGlkID0gYXdhaXQgdGhpcy5lbWFpbE1GQVNlcnZpY2UudmVyaWZ5RW1haWxNRkFDb2RlKFxuXHRcdFx0XHRlbWFpbCxcblx0XHRcdFx0ZW1haWxNRkFDb2RlLFxuXHRcdFx0XHRqd3Rcblx0XHRcdCk7XG5cblx0XHRcdGlmICghaXNWYWxpZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkludmFsaWRJbnB1dEVycm9yKFxuXHRcdFx0XHRcdCdJbnZhbGlkIE1GQSBjb2RlJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKFxuXHRcdFx0XHRgTUZBIHZlcmlmaWNhdGlvbiBzdWNjZXNzZnVsIGZvciB1c2VyOiAke3VzZXIuZW1haWx9YFxuXHRcdFx0KTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcignRXJyb3IgdmVyaWZ5aW5nIEVtYWlsIE1GQScsIHsgZXJyb3IgfSk7XG5cdFx0XHR0aHJvdyBlcnJvcjtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgYXN5bmMgZ2VuZXJhdGVUT1RQKFxuXHRcdHVzZXJJZDogc3RyaW5nXG5cdCk6IFByb21pc2U8eyBzZWNyZXQ6IHN0cmluZzsgcXJDb2RlVXJsOiBzdHJpbmcgfT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCB1c2VyID0gYXdhaXQgdGhpcy5maW5kVXNlckJ5SWQodXNlcklkKTtcblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLk1pc3NpbmdSZXNvdXJjZUVycm9yKFxuXHRcdFx0XHRcdGBVc2VyIHdpdGggSUQgJHt1c2VySWR9IG5vdCBmb3VuZGBcblx0XHRcdFx0KTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgeyBiYXNlMzIsIG90cGF1dGhfdXJsIH0gPVxuXHRcdFx0XHR0aGlzLlRPVFBTZXJ2aWNlLmdlbmVyYXRlVE9UUFNlY3JldCgpO1xuXHRcdFx0Y29uc3QgcXJDb2RlVXJsID1cblx0XHRcdFx0YXdhaXQgdGhpcy5UT1RQU2VydmljZS5nZW5lcmF0ZVFSQ29kZShvdHBhdXRoX3VybCk7XG5cblx0XHRcdHVzZXIudG90cFNlY3JldCA9IGJhc2UzMjtcblx0XHRcdGF3YWl0IHVzZXIuc2F2ZSgpO1xuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKGBUT1RQIHNlY3JldCBnZW5lcmF0ZWQgZm9yIHVzZXIgJHt1c2VyLmVtYWlsfWApO1xuXHRcdFx0cmV0dXJuIHsgc2VjcmV0OiBiYXNlMzIsIHFyQ29kZVVybCB9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRgRXJyb3IgZ2VuZXJhdGluZyBUT1RQIGZvciB1c2VyICR7dXNlcklkfTogJHtTdHJpbmcoZXJyb3IpfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yLCBkZXRhaWxzOiB7IHVzZXJJZCB9IH0pO1xuXHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5TZXJ2aWNlVW5hdmFpbGFibGVFcnJvcihcblx0XHRcdFx0MTAsXG5cdFx0XHRcdCdUT1RQIGdlbmVyYXRpb24gZmFpbGVkLiBQbGVhc2UgdHJ5IGFnYWluLidcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGFzeW5jIHZlcmlmeVRPVFAodXNlcklkOiBzdHJpbmcsIHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgdXNlciA9IGF3YWl0IHRoaXMuZmluZFVzZXJCeUlkKHVzZXJJZCk7XG5cdFx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdFx0dGhyb3cgbmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5NaXNzaW5nUmVzb3VyY2VFcnJvcihcblx0XHRcdFx0XHRgVXNlciB3aXRoIElEICR7dXNlcklkfSBub3QgZm91bmRgXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBzYW5pdGl6ZWRUb2tlbiA9IHRva2VuLnRyaW0oKTtcblx0XHRcdGNvbnN0IGlzVmFsaWQgPSB0aGlzLlRPVFBTZXJ2aWNlLnZlcmlmeVRPVFBUb2tlbihcblx0XHRcdFx0dXNlci50b3RwU2VjcmV0ISxcblx0XHRcdFx0c2FuaXRpemVkVG9rZW5cblx0XHRcdCk7XG5cblx0XHRcdGlmIChpc1ZhbGlkKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0YFRPVFAgdmVyaWZpZWQgc3VjY2Vzc2Z1bGx5IGZvciB1c2VyICR7dXNlci5lbWFpbH1gXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIFRPVFAgdG9rZW4gZm9yIHVzZXIgJHt1c2VyLmVtYWlsfWApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gaXNWYWxpZDtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0YEVycm9yIHZlcmlmeWluZyBUT1RQIGZvciB1c2VyICR7dXNlcklkfTogJHtTdHJpbmcoZXJyb3IpfWBcblx0XHRcdCk7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7XG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRkZXRhaWxzOiB7IHVzZXJJZCwgdG9rZW4gfVxuXHRcdFx0fSk7XG5cdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLlNlcnZpY2VVbmF2YWlsYWJsZUVycm9yKFxuXHRcdFx0XHQxMCxcblx0XHRcdFx0J1RPVFAgdmVyaWZpY2F0aW9uIGZhaWxlZC4gUGxlYXNlIHRyeSBhZ2Fpbi4nXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBjb21wYXJlUGFzc3dvcmQoXG5cdFx0dXNlcjogVXNlckluc3RhbmNlSW50ZXJmYWNlLFxuXHRcdHBhc3N3b3JkOiBzdHJpbmdcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGFyZ29uMiA9IGF3YWl0IHRoaXMubG9hZEFyZ29uMigpO1xuXHRcdFx0Y29uc3QgcGVwcGVyID0gcHJvY2Vzcy5lbnYuUEVQUEVSO1xuXG5cdFx0XHRpZiAoIXBlcHBlcikge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5lcnJvcignUEVQUEVSIGNvdWxkIG5vdCBiZSBmb3VuZCcpO1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludGVybmFsIHNlcnZlciBlcnJvcicpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYXdhaXQgYXJnb24yLnZlcmlmeSh1c2VyLnBhc3N3b3JkLCBwYXNzd29yZCArIHBlcHBlcik7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHsgZXJyb3IsIGFjdGlvbjogJ2NvbXBhcmVQYXNzd29yZCcgfSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIGxvYWRBeGlvcygpOiBQcm9taXNlPFVzZXJDb250cm9sbGVyRGVwc1snYXhpb3MnXT4ge1xuXHRcdHJldHVybiAoYXdhaXQgaW1wb3J0KCdheGlvcycpKS5kZWZhdWx0O1xuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIGxvYWRCY3J5cHQoKTogUHJvbWlzZTxVc2VyQ29udHJvbGxlckRlcHNbJ2JjcnlwdCddPiB7XG5cdFx0cmV0dXJuIChhd2FpdCBpbXBvcnQoJ2JjcnlwdCcpKS5kZWZhdWx0O1xuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIGxvYWRBcmdvbjIoKTogUHJvbWlzZTxVc2VyQ29udHJvbGxlckRlcHNbJ2FyZ29uMiddPiB7XG5cdFx0cmV0dXJuIChhd2FpdCBpbXBvcnQoJ2FyZ29uMicpKS5kZWZhdWx0O1xuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIGxvYWRKd3QoKTogUHJvbWlzZTxVc2VyQ29udHJvbGxlckRlcHNbJ2p3dCddPiB7XG5cdFx0cmV0dXJuIChhd2FpdCBpbXBvcnQoJ2pzb253ZWJ0b2tlbicpKS5kZWZhdWx0O1xuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIGxvYWRVdWlkdjQoKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRjb25zdCB7IHY0OiB1dWlkdjQgfSA9IGF3YWl0IGltcG9ydCgndXVpZCcpO1xuXHRcdHJldHVybiB1dWlkdjQoKTtcblx0fVxuXG5cdHByb3RlY3RlZCBhc3luYyBsb2FkWnhjdmJuKCk6IFByb21pc2U8VXNlckNvbnRyb2xsZXJEZXBzWyd6eGN2Ym4nXT4ge1xuXHRcdHJldHVybiAoYXdhaXQgaW1wb3J0KCd6eGN2Ym4nKSkuZGVmYXVsdDtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBzaHV0ZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnU2h1dHRpbmcgZG93biBBdXRoQ29udHJvbGxlci4uLicpO1xuXG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdDbGVhcmluZyBBdXRoQ29udHJvbGxlciBjYWNoZS4uLicpO1xuXHRcdFx0YXdhaXQgdGhpcy5jYWNoZVNlcnZpY2UuY2xlYXJOYW1lc3BhY2UoJ0F1dGhDb250cm9sbGVyJyk7XG5cdFx0XHR0aGlzLmxvZ2dlci5pbmZvKCdBdXRoQ29udHJvbGxlciBjYWNoZSBjbGVhcmVkIHN1Y2Nlc3NmdWxseS4nKTtcblxuXHRcdFx0QXV0aENvbnRyb2xsZXIuaW5zdGFuY2UgPSBudWxsO1xuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbygnQXV0aENvbnRyb2xsZXIgc2h1dGRvd24gY29tcGxldGVkIHN1Y2Nlc3NmdWxseS4nKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc3QgdXRpbGl0eUVycm9yID1cblx0XHRcdFx0bmV3IHRoaXMuZXJyb3JIYW5kbGVyLkVycm9yQ2xhc3Nlcy5VdGlsaXR5RXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0XHRgRXJyb3IgZHVyaW5nIEF1dGhDb250cm9sbGVyIHNodXRkb3duOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogZXJyb3J9YFxuXHRcdFx0XHQpO1xuXHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcih1dGlsaXR5RXJyb3IubWVzc2FnZSk7XG5cdFx0XHR0aGlzLmVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yOiB1dGlsaXR5RXJyb3IgfSk7XG5cdFx0fVxuXHR9XG5cblx0cHJvdGVjdGVkIGhhbmRsZUF1dGhDb250cm9sbGVyRXJyb3IoXG5cdFx0ZXJyb3I6IHVua25vd24sXG5cdFx0ZXJyb3JIZWFkZXI6IHN0cmluZyxcblx0XHRlcnJvckRldGFpbHM6IG9iamVjdCxcblx0XHRjdXN0b21NZXNzYWdlOiBzdHJpbmdcblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGVycm9yTWVzc2FnZSA9IGAke2N1c3RvbU1lc3NhZ2V9OiAke2Vycm9yfVxcbiR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLnN0YWNrIDogJyd9YDtcblx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoZXJyb3JNZXNzYWdlKTtcblxuXHRcdFx0Y29uc3QgcmVzb3VyY2VFcnJvciA9XG5cdFx0XHRcdG5ldyB0aGlzLmVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuQXV0aENvbnRyb2xsZXJFcnJvcihcblx0XHRcdFx0XHRlcnJvckhlYWRlcixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkZXRhaWxzOiBlcnJvckRldGFpbHMsXG5cdFx0XHRcdFx0XHRleHBvc2VUb0NsaWVudDogZmFsc2Vcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cblx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKHtcblx0XHRcdFx0ZXJyb3I6IHJlc291cmNlRXJyb3Jcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIGhhbmRsaW5nIHJlc291cmNlIG1hbmFnZXIgZXJyb3I6ICR7ZXJyb3J9YFxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IHNldmVyaXR5ID0gdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JTZXZlcml0eS5XQVJOSU5HO1xuXHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuaGFuZGxlRXJyb3Ioe1xuXHRcdFx0XHRlcnJvcixcblx0XHRcdFx0ZGV0YWlsczoge1xuXHRcdFx0XHRcdGNvbnRleHQ6ICdBdXRoIENvbnRyb2xsZXInLFxuXHRcdFx0XHRcdGFjdGlvbjogJ1Bhc3NpbmcgZXJyb3IgZnJvbSBBdXRoIENvbnRyb2xsZXIgaGFuZGxlciB0byBFcnJvckhhbmRsZXJTZXJ2aWNlJyxcblx0XHRcdFx0XHRub3RlczogJ0Vycm9yIG9jY3VycmVkIHdoaWxlIGhhbmRsaW5nIEF1dGggQ29udHJvbGxlciBlcnJvcjogQXV0aENvbnRyb2xsZXIuaGFuZGxlQXV0aENvbnRyb2xsZXJFcnJvcidcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V2ZXJpdHlcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufVxuIl19
