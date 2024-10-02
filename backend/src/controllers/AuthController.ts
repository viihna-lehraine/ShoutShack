import { ServiceFactory } from '../index/factory';
import {
	AuthControllerInterface,
	UserControllerDeps,
	UserInstanceInterface
} from '../index/interfaces';
import { validateDependencies } from '../utils/helpers';
import { createUserModel } from '../models/UserModelFile';
import { generateEmailMFATemplate } from '../templates/emailMFACodeTemplate';
import passport from 'passport';
import { RequestHandler } from 'express';
import { serviceTTLConfig } from '../config/cache';

export class AuthController implements AuthControllerInterface {
	private static instance: AuthController | null = null;
	private backupCodeService = ServiceFactory.getBackupCodeService();
	private emailMFAService = ServiceFactory.getEmailMFAService();
	private JWTAuthMiddlewareService =
		ServiceFactory.getJWTAuthMiddlewareService();
	private JWTService = ServiceFactory.getJWTService();
	private passportAuthService = ServiceFactory.getPassportService();
	private passportAuthMiddlewareService =
		ServiceFactory.getPassportAuthMiddlewareService();
	private passwordService = ServiceFactory.getPasswordService();
	private TOTPService = ServiceFactory.getTOTPService();
	protected UserController = ServiceFactory.getUserController();
	protected cacheService = ServiceFactory.getCacheService();
	protected logger = ServiceFactory.getLoggerService();
	protected errorLogger = ServiceFactory.getErrorLoggerService();
	protected errorHandler = ServiceFactory.getErrorHandlerService();
	protected secrets = ServiceFactory.getVaultService();
	protected mailer = ServiceFactory.getMailerService();
	private sequelize =
		ServiceFactory.getDatabaseController().getSequelizeInstance();

	private constructor() {}

	public static getInstance(): AuthController {
		if (!AuthController.instance) {
			AuthController.instance = new AuthController();
		}

		return AuthController.instance;
	}

	public async initializeAuthMiddleware(): Promise<void> {
		if (!this.sequelize) {
			throw new Error('Sequelize instance is not available');
		}

		const UserModel = createUserModel();

		await this.passportAuthService.configurePassport(passport, UserModel);
	}

	public initializeJWTAuthMiddleware(): RequestHandler {
		return this.JWTAuthMiddlewareService.initializeJWTAuthMiddleware();
	}

	public initializePassportAuthMiddleware(): RequestHandler {
		return this.passportAuthMiddlewareService.initializePassportAuthMiddleware(
			{
				passport,
				authenticateOptions: { session: false },
				validateDependencies
			}
		);
	}

	protected async findUserById(
		userId: string
	): Promise<UserInstanceInterface | null> {
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

	protected async findUserByEmail(
		email: string
	): Promise<UserInstanceInterface | null> {
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

	public async loginUser(
		email: string,
		password: string
	): Promise<{ success: boolean; token?: string; requiresMFA?: boolean }> {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					'User not found'
				);
			}

			const argon2 = await this.loadArgon2();
			const pepper = await this.secrets.retrieveSecret(
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

			if (user.isMfaEnabled) {
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

	protected async authenticateUser(
		userId: string,
		password: string
	): Promise<boolean> {
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

	private async handleMFAForLogin(
		user: UserInstanceInterface
	): Promise<boolean> {
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

	public async recoverPassword(email: string): Promise<void> {
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

	public async resetPassword(
		user: UserInstanceInterface,
		newPassword: string
	): Promise<UserInstanceInterface | null> {
		try {
			const hashedPassword =
				await this.passwordService.hashPassword(newPassword);
			user.password = hashedPassword;

			user.resetPasswordToken = null;
			user.resetPasswordExpires = null;

			await user.save();

			this.logger.info(
				`Password reset successfully for user ${user.username}`
			);
			return user as UserInstanceInterface;
		} catch (error) {
			this.logger.error(
				`Error resetting password for user ${user.username}: ${error}`
			);
			this.errorHandler.handleError({ error, action: 'resetPassword' });

			return null;
		}
	}

	public async generateResetToken(
		user: UserInstanceInterface
	): Promise<string | null> {
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

	public async validateResetToken(
		userId: string,
		token: string
	): Promise<UserInstanceInterface | null> {
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

	public async enableMfa(userId: string): Promise<boolean> {
		try {
			const user = await this.UserController.findOne({
				id: userId
			});

			if (!user) {
				this.logger.warn(`User with ID ${userId} not found`);
				return false;
			}

			user.isMfaEnabled = true;
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

	public async disableMfa(userId: string): Promise<boolean> {
		try {
			const user = await this.UserController.findOne({
				id: userId
			});

			if (!user) {
				this.logger.warn(`User with ID ${userId} not found`);
				return false;
			}

			user.isMfaEnabled = false;
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

	public async generateBackupCodesForUser(userId: string): Promise<string[]> {
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

	public async verifyBackupCodeForUser(
		userId: string,
		inputCode: string
	): Promise<boolean> {
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

	public async generateEmailMFACode(email: string): Promise<boolean> {
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

	public async verifyEmailMFACode(
		email: string,
		emailMFACode: string
	): Promise<boolean> {
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

	public async generateTOTP(
		userId: string
	): Promise<{ secret: string; qrCodeUrl: string }> {
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

	public async verifyTOTP(userId: string, token: string): Promise<boolean> {
		try {
			const user = await this.findUserById(userId);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					`User with ID ${userId} not found`
				);
			}
			const sanitizedToken = token.trim();
			const isValid = this.TOTPService.verifyTOTPToken(
				user.totpSecret!,
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

	public async comparePassword(
		user: UserInstanceInterface,
		password: string
	): Promise<boolean> {
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

	protected async loadAxios(): Promise<UserControllerDeps['axios']> {
		return (await import('axios')).default;
	}

	protected async loadBcrypt(): Promise<UserControllerDeps['bcrypt']> {
		return (await import('bcrypt')).default;
	}

	protected async loadArgon2(): Promise<UserControllerDeps['argon2']> {
		return (await import('argon2')).default;
	}

	protected async loadJwt(): Promise<UserControllerDeps['jwt']> {
		return (await import('jsonwebtoken')).default;
	}

	protected async loadUuidv4(): Promise<string> {
		const { v4: uuidv4 } = await import('uuid');
		return uuidv4();
	}

	protected async loadZxcvbn(): Promise<UserControllerDeps['zxcvbn']> {
		return (await import('zxcvbn')).default;
	}

	protected handleAuthControllerError(
		error: unknown,
		errorHeader: string,
		errorDetails: object,
		customMessage: string
	): void {
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
