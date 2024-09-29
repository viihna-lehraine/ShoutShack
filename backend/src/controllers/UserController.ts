import { User } from '../models/UserModelFile';
import { hashPassword } from '../auth/hash';
import { validateDependencies } from '../utils/helpers';
import {
	UserAttributesInterface,
	UserInstanceInterface,
	UserControllerDeps,
	UserControllerInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { InferAttributes, WhereOptions } from 'sequelize/types';
import { createEmail2FAUtil } from '../auth/emailMfa';

export class UserController implements UserControllerInterface {
	private static instance: UserController | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private configService = ServiceFactory.getConfigService();
	private secrets = ServiceFactory.getSecretsStore();
	private mailer = ServiceFactory.getMailerService();

	constructor(private userModel = User) {
		validateDependencies(
			[{ name: 'userModel', instance: this.userModel }],
			this.logger
		);
	}

	public static getInstance(): UserController {
		if (!UserController.instance) {
			UserController.instance = new UserController();
		}

		return UserController.instance;
	}

	private async loadArgon2(): Promise<UserControllerDeps['argon2']> {
		return (await import('argon2')).default;
	}

	private async loadAxios(): Promise<UserControllerDeps['axios']> {
		return (await import('axios')).default;
	}

	private async loadJwt(): Promise<UserControllerDeps['jwt']> {
		return (await import('jsonwebtoken')).default;
	}

	private async loadUuidv4(): Promise<string> {
		const { v4: uuidv4 } = await import('uuid');
		return uuidv4();
	}

	private async loadTotpMfa(): Promise<UserControllerDeps['totpMfa']> {
		const { createTOTPUtil } = await import('../auth/totpMfa');
		const speakeasy = (await import('speakeasy')).default;
		const QRCode = (await import('qrcode')).default;

		const totpMfa = createTOTPUtil({
			speakeasy,
			QRCode,
			validateDependencies: (await import('../utils/helpers'))
				.validateDependencies
		});

		return totpMfa;
	}

	private async loadZxcvbn(): Promise<UserControllerDeps['zxcvbn']> {
		return (await import('zxcvbn')).default;
	}

	private async loadXss(): Promise<UserControllerDeps['xss']> {
		return (await import('xss')).default;
	}

	private mapToUserInstance(user: User): UserInstanceInterface {
		return {
			id: user.id,
			userId: user.userId || undefined,
			username: user.username,
			password: user.password,
			email: user.email,
			isAccountVerified: user.isVerified,
			resetPasswordToken: user.resetPasswordToken,
			resetPasswordExpires: user.resetPasswordExpires,
			isMfaEnabled: user.isMfaEnabled,
			totpSecret: user.totpSecret,
			email2faToken: user.email2faToken,
			email2faTokenExpires: user.email2faTokenExpires,
			creationDate: user.creationDate,
			comparePassword: async (
				password: string,
				argon2: typeof import('argon2')
			): Promise<boolean> => {
				return await argon2.verify(
					user.password,
					password + process.env.PEPPER
				);
			},
			save: async (): Promise<void> => {
				await user.save();
			}
		};
	}

	public async findUserByEmail(
		email: string
	): Promise<UserInstanceInterface | null> {
		const user = await this.userModel.findOne({ where: { email } });
		if (!user) {
			return null;
		}

		return this.mapToUserInstance(user);
	}

	public async loginUser(
		email: string,
		password: string
	): Promise<{ success: boolean; token?: string }> {
		try {
			const user = await this.findUserByEmail(email);

			if (!user) {
				this.logger.debug('User not found');
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					'User not found'
				);
			}

			const pepper = this.secrets.retrieveSecrets('PEPPER');
			if (!pepper) {
				this.logger.error('PEPPER secret not found');
				throw new Error('Internal server error');
			}

			const argon2 = await this.loadArgon2();
			const isMatch = await argon2.verify(
				user.password,
				password + pepper
			);

			if (!isMatch) {
				this.logger.warn('Password mismatch');
				throw new this.errorHandler.ErrorClasses.InvalidInputError(
					'Incorrect password'
				);
			}

			const jwtSecret = this.secrets.retrieveSecrets('JWT_SECRET');
			if (!jwtSecret) {
				this.logger.error('JWT_SECRET not found');
				throw new Error('Internal server error');
			}

			const jwt = await this.loadJwt();
			const payload = { id: user.userId, username: user.username };
			const token = jwt.sign(payload, jwtSecret as string, {
				expiresIn: '1h'
			});

			this.secrets.reEncryptSecret('PEPPER');
			this.secrets.reEncryptSecret('JWT_SECRET');

			return { success: true, token: `Bearer ${token}` };
		} catch (err) {
			this.logger.error('Login failed', { error: err });
			throw err;
		}
	}

	public async createUser(
		userDetails: Omit<
			UserAttributesInterface,
			'id' | 'creationDate' | 'userId'
		>
	): Promise<UserInstanceInterface | null> {
		try {
			const isPasswordStrong = await this.checkPasswordStrength(
				userDetails.password
			);

			if (!isPasswordStrong) {
				this.logger.warn('Password strength validation failed');
				throw new this.errorHandler.ErrorClasses.PasswordValidationError(
					'Password does not meet strength requirements',
					{ exposeToClient: true }
				);
			}

			const hashedPassword = await hashPassword(userDetails.password);
			const userUuid = await this.loadUuidv4();
			const newUser = await this.userModel.create({
				id: userUuid,
				...userDetails,
				password: hashedPassword,
				isVerified: false,
				resetPasswordToken: null,
				resetPasswordExpires: null,
				creationDate: new Date()
			});

			this.logger.info(`User ${newUser.username} created successfully`);
			await this.sendConfirmationEmail(newUser);

			return this.mapToUserInstance(newUser);
		} catch (err) {
			this.logger.error(`Error creating user: ${String(err)}`);
			this.errorHandler.handleError({
				error: err || 'User creation failed'
			});
			throw err;
		}
	}

	private async checkPasswordStrength(password: string): Promise<boolean> {
		const zxcvbn = await this.loadZxcvbn();
		const { score } = zxcvbn(password);

		if (score < 3) {
			this.logger.warn('Password strength too weak');
			return false;
		}

		try {
			const axios = await this.loadAxios();
			const firstFiveChars = password.substring(0, 5);
			const remainingChars = password.substring(5).toUpperCase();

			const pwnedResponse = await axios.get<string>(
				`https://api.pwnedpasswords.com/range/${firstFiveChars}`
			);

			const pwnedList = pwnedResponse.data
				.split('\n')
				.map((line: string) => line.split(':')[0]);

			if (pwnedList.includes(remainingChars)) {
				this.logger.warn('Password found in breach');
				return false;
			}
		} catch (error) {
			this.logger.error(
				`Error checking password breach status: ${String(error)}`
			);
		}

		return true;
	}

	public async findOne(
		criteria: WhereOptions<InferAttributes<User>>
	): Promise<UserInstanceInterface | null> {
		try {
			const user = await this.userModel.findOne({ where: criteria });
			if (!user) {
				this.logger.debug('User not found with provided criteria');

				return null;
			}

			return this.mapToUserInstance(user);
		} catch (error) {
			this.errorHandler.handleError({ error, action: 'findOne' });
			return null;
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

	public async verifyUserAccount(userId: string): Promise<boolean> {
		try {
			const user = await this.userModel.findOne({
				where: { id: userId }
			});

			if (!user) {
				this.logger.warn(`User with ID ${userId} not found`);
				return false;
			}

			user.isVerified = true;
			await user.save();
			this.logger.info(`User ${user.username} verified successfully`);
			return true;
		} catch (error) {
			this.errorHandler.handleError({
				error,
				action: 'verifyUserAccount',
				details: { userId }
			});

			return false;
		}
	}

	public async generateResetToken(
		user: UserInstanceInterface
	): Promise<string | null> {
		try {
			const resetToken = await this.loadUuidv4();
			user.resetPasswordToken = resetToken;
			user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiration
			await user.save();

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
			const user = await this.userModel.findOne({
				where: { id: userId }
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
			const user = await this.userModel.findOne({
				where: { id: userId }
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

	public async findUserById(
		userId: string
	): Promise<UserInstanceInterface | null> {
		try {
			const user = await this.userModel.findOne({
				where: { id: userId }
			});

			if (!user) {
				this.logger.warn(`User with ID ${userId} not found`);
				return null;
			}

			return this.mapToUserInstance(user);
		} catch (error) {
			this.logger.error(`Error finding user by ID ${userId}: ${error}`);
			this.errorHandler.handleError({ error, action: 'findUserById' });
			return null;
		}
	}

	public async resetPassword(
		user: UserInstanceInterface,
		newPassword: string
	): Promise<UserInstanceInterface | null> {
		try {
			const hashedPassword = await hashPassword(newPassword);
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

	private removeUndefinedFields<T>(obj: Partial<T>): Partial<T> {
		return Object.fromEntries(
			Object.entries(obj).filter(([, v]) => v !== undefined)
		) as Partial<T>;
	}

	public async updateUser(
		user: UserInstanceInterface,
		updatedDetails: Partial<UserInstanceInterface>
	): Promise<UserInstanceInterface | null> {
		try {
			const fullUser = await this.userModel.findOne({
				where: { id: user.id }
			});

			if (!fullUser) {
				this.logger.warn(`User with id ${user.id} not found`);
				return null;
			}

			if (updatedDetails.password) {
				const hashedPassword = await hashPassword(
					updatedDetails.password
				);
				updatedDetails.password = hashedPassword;
			}

			const cleanUpdatedDetails =
				this.removeUndefinedFields(updatedDetails);
			const updateData: Partial<InferAttributes<User>> =
				cleanUpdatedDetails as Partial<InferAttributes<User>>;
			const updatedUser = await fullUser.update(updateData);

			this.logger.info(
				`User ${updatedUser.username} updated successfully`
			);

			return this.mapToUserInstance(updatedUser);
		} catch (error) {
			this.errorLogger.logError(`Error updating user: ${String(error)}`);
			this.errorHandler.handleError({ error });
			return null;
		}
	}

	private async sendConfirmationEmail(user: User): Promise<void> {
		try {
			const jwtSecret = this.secrets.retrieveSecrets('JWT_SECRET');
			if (typeof jwtSecret !== 'string') {
				throw new this.errorHandler.ErrorClasses.ServiceUnavailableError(
					10,
					'Invalid JWT secret',
					{ exposeToClient: false }
				);
			}

			const jwt = await this.loadJwt();
			const confirmationToken = jwt.sign({ id: user.id }, jwtSecret, {
				expiresIn: '1d'
			});

			const baseUrl = this.configService.getEnvVariable('baseUrl');
			const port = this.configService.getEnvVariable('serverPort');
			const confirmationUrl = `${baseUrl}${port}/api/users/confirm/${confirmationToken}`;

			const mailOptions = {
				from: this.configService.getEnvVariable('emailUser'),
				to: user.email,
				subject: 'Please Confirm Your Account',
				html: `
					<p>Hi ${user.username},</p>
					<p>Please confirm your account by clicking the following link:</p>
					<a href="${confirmationUrl}">Confirm Account</a>
				`
			};

			const transporter = await this.mailer.getTransporter();
			await transporter.sendMail(mailOptions);

			this.logger.info(`Confirmation email sent to ${user.email}`);
		} catch (error) {
			this.logger.logError(
				`Error sending confirmation email to ${user.email}`
			);
			this.errorHandler.handleError({
				error,
				details: { userId: user.id }
			});
			throw error;
		}
	}

	public async deleteUser(userId: string): Promise<boolean> {
		try {
			const user = await this.userModel.findOne({
				where: { id: userId }
			});

			if (!user) {
				this.logger.warn(`User with id ${userId} not found`);
				return false;
			}

			await user.destroy();
			this.logger.info(`User with id ${userId} deleted successfully`);
			return true;
		} catch (error) {
			this.errorLogger.logError(
				`Error deleting user with id ${userId}\n${String(error)}`
			);
			this.errorHandler.handleError({
				error,
				details: { userId }
			});
			return false;
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

			const totpMfa = await this.loadTotpMfa();
			const { base32, otpauth_url } = totpMfa.generateTOTPSecret();
			const qrCodeUrl = await totpMfa.generateQRCode(otpauth_url);

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

			const totpMfa = await this.loadTotpMfa();
			const sanitizedToken = token.trim();
			const isValid = totpMfa.verifyTOTPToken(
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
			user.resetPasswordExpires = new Date(Date.now() + 1800000); // 30 minutes
			await user.save();

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

	public async generateEmail2FA(email: string): Promise<void> {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				this.logger.warn(
					`2FA request for non-existent email: ${email}`
				);
				if (process.env.NODE_ENV === 'production') {
					return;
				} else {
					throw new this.errorHandler.ErrorClasses.MissingResourceError(
						'User not found'
					);
				}
			}

			const bcrypt = await import('bcrypt');
			const jwt = await this.loadJwt();
			const email2FAUtil = await createEmail2FAUtil({
				bcrypt,
				jwt,
				validateDependencies
			});
			const { email2FAToken } = await email2FAUtil.generateEmail2FACode();

			user.email2faToken = email2FAToken;
			user.email2faTokenExpires = new Date(Date.now() + 30 * 60000); // 30 minutes
			await user.save();

			const transporter = await this.mailer.getTransporter();
			await transporter.sendMail({
				to: user.email,
				subject: 'Your Login Code',
				text: `Your 2FA code is ${email2FAToken}`
			});

			this.logger.info(`2FA email sent to ${user.email}`);
		} catch (error) {
			this.errorLogger.logError(
				`Error generating 2FA for ${email}: ${String(error)}`
			);
			this.errorHandler.handleError({ error, details: { email } });
			throw new this.errorHandler.ErrorClasses.ServiceUnavailableError(
				10,
				'Unable to generate 2FA at this time. Please try again later.'
			);
		}
	}

	public async verifyEmail2FA(
		email: string,
		email2FACode: string
	): Promise<boolean> {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					'User not found'
				);
			}

			const email2faToken = user.email2faToken || '';
			const email2faTokenExpires = user.email2faTokenExpires;

			if (!email2faTokenExpires || email2faTokenExpires < new Date()) {
				this.logger.warn(`Expired 2FA code for user ${user.email}`);
				throw new this.errorHandler.ErrorClasses.MissingResourceError(
					'2FA code has expired'
				);
			}

			const bcrypt = await import('bcrypt');
			const jwt = await this.loadJwt();
			const email2FAUtil = await createEmail2FAUtil({
				bcrypt,
				jwt,
				validateDependencies
			});

			const isEmail2FACodeValid = await email2FAUtil.verifyEmail2FACode(
				email2faToken,
				email2FACode
			);

			if (!isEmail2FACodeValid) {
				this.logger.warn(`Invalid 2FA code for user ${user.email}`);
			} else {
				this.logger.info(
					`2FA code verified successfully for user ${user.email}`
				);
			}

			return isEmail2FACodeValid;
		} catch (error) {
			this.errorLogger.logError(
				`Error verifying 2FA for email ${email}: ${String(error)}`
			);
			this.errorHandler.handleError({
				error,
				details: { email, email2FACode }
			});
			throw error;
		}
	}
}
