import { User } from '../models/UserModelFile';
import { hashPassword } from '../auth/hash';
import { validateDependencies } from '../utils/helpers';
import {
	UserAttributesInterface,
	UserInstanceInterface,
	UserServiceDeps,
	UserServiceInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import { Request, Response } from 'express';
import { InferAttributes, WhereOptions } from 'sequelize/types';
import { createEmail2FAUtil } from '../auth/emailMfa';

export class UserService implements UserServiceInterface {
	private static instance: UserService | null = null;
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

	public static getInstance(): UserService {
		if (!UserService.instance) {
			UserService.instance = new UserService();
		}

		return UserService.instance;
	}

	private async loadArgon2(): Promise<UserServiceDeps['argon2']> {
		return (await import('argon2')).default;
	}

	private async loadAxios(): Promise<UserServiceDeps['axios']> {
		return (await import('axios')).default;
	}

	private async loadJwt(): Promise<UserServiceDeps['jwt']> {
		return (await import('jsonwebtoken')).default;
	}

	private async loadUuidv4(): Promise<string> {
		const { v4: uuidv4 } = await import('uuid');
		return uuidv4();
	}

	private async loadTotpMfa(): Promise<UserServiceDeps['totpMfa']> {
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

	private async loadZxcvbn(): Promise<UserServiceDeps['zxcvbn']> {
		return (await import('zxcvbn')).default;
	}

	private async loadXss(): Promise<UserServiceDeps['xss']> {
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
		req: Request,
		res: Response
	): Promise<Response | void> {
		try {
			const { email, password } = req.body;
			const xss = await this.loadXss();
			const sanitizedEmail = xss(email);
			const sanitizedPassword = xss(password);

			const user = await this.findUserByEmail(sanitizedEmail);

			if (!user) {
				this.logger.debug('400 - User not found');
				return res.status(400).json({ email: 'User not found' });
			}

			const pepper = this.secrets.retrieveSecrets('PEPPER');
			const argon2 = await this.loadArgon2();
			const isMatch = await argon2.verify(
				user.password,
				sanitizedPassword + pepper
			);

			if (!isMatch) {
				this.logger.warn('Password mismatch');
				return res.status(400).json({ password: 'Incorrect password' });
			}

			const jwtSecret = this.secrets.retrieveSecrets(
				'JWT_SECRET'
			)! as string;
			const jwt = await this.loadJwt();

			const payload = { id: user.userId, username: user.username };
			const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

			this.secrets.reEncryptSecret('PEPPER');
			this.secrets.reEncryptSecret('JWT_SECRET');

			return res.json({ success: true, token: `Bearer ${token}` });
		} catch (err) {
			this.errorHandler.handleError({ error: err || 'Login failed' });
			return res.status(500).json({ error: 'Login - Server error' });
		}
	}

	public async createUser(
		userDetails: Omit<
			UserAttributesInterface,
			'id' | 'creationDate' | 'userId'
		>
	): Promise<UserInstanceInterface | null> {
		const hashedPassword = await hashPassword(userDetails.password);
		const generateUuid = await this.loadUuidv4();

		const newUser = await this.userModel.create({
			id: generateUuid,
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
	}

	private async checkPasswordStrength(password: string): Promise<boolean> {
		const zxcvbn = await this.loadZxcvbn();
		const { score } = zxcvbn(password);
		if (score < 3) {
			this.logger.warn('Password strength too weak');
			return false;
		}

		const axios = await this.loadAxios();
		const pwnedResponse = await axios.get<string>(
			`https://api.pwnedpasswords.com/range/${password.substring(0, 5)}`
		);
		const pwnedList = pwnedResponse.data
			.split('\n')
			.map((p: string) => p.split(':')[0]);
		if (pwnedList.includes(password.substring(5).toUpperCase())) {
			this.logger.warn('Password found in breach');
			return false;
		}

		return true;
	}

	public async findOne(
		criteria: WhereOptions<InferAttributes<User>>
	): Promise<UserInstanceInterface | null> {
		const user = await this.userModel.findOne({ where: criteria });
		return user ? this.mapToUserInstance(user) : null;
	}

	public async comparePassword(
		user: UserInstanceInterface,
		password: string
	): Promise<boolean> {
		const argon2 = await this.loadArgon2();
		return await argon2.verify(
			user.password,
			password + process.env.PEPPER
		);
	}

	public async verifyUserAccount(userId: string): Promise<boolean> {
		const user = await this.userModel.findOne({ where: { id: userId } });
		if (!user) return false;

		user.isVerified = true;
		await user.save();
		this.logger.info(`User ${user.username} verified successfully`);
		return true;
	}

	public async generateResetToken(
		user: UserInstanceInterface
	): Promise<string | null> {
		const resetToken = await this.loadUuidv4();
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpires = new Date(Date.now() + 3600000);
		await user.save();
		this.logger.info(`Reset token generated for user ${user.username}`);
		return resetToken;
	}

	public validatePassword(password: string): boolean {
		const isValidLength = password.length >= 8 && password.length <= 128;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		const hasSpecial = /[^\dA-Za-z]/.test(password);

		return (
			isValidLength &&
			hasUpperCase &&
			hasLowerCase &&
			hasNumber &&
			hasSpecial
		);
	}

	public async validateResetToken(
		userId: string,
		token: string
	): Promise<UserInstanceInterface | null> {
		const user = await this.findUserById(userId);
		if (
			user &&
			user.resetPasswordToken === token &&
			user.resetPasswordExpires &&
			user.resetPasswordExpires > new Date()
		) {
			return user;
		}
		this.logger.warn(`Invalid or expired reset token for user ${userId}`);
		return null;
	}

	public async enableMfa(userId: string): Promise<boolean> {
		const user = await this.userModel.findOne({ where: { id: userId } });
		if (!user) return false;

		user.isMfaEnabled = true;
		await user.save();
		this.logger.info(`MFA enabled for user ${user.username}`);
		return true;
	}

	public async disableMfa(userId: string): Promise<boolean> {
		const user = await this.userModel.findOne({ where: { id: userId } });
		if (!user) return false;

		user.isMfaEnabled = false;
		await user.save();
		this.logger.info(`MFA disabled for user ${user.username}`);
		return true;
	}

	public async findUserById(
		userId: string
	): Promise<UserInstanceInterface | null> {
		const user = await this.userModel.findOne({ where: { id: userId } });
		return user ? this.mapToUserInstance(user) : null;
	}

	async resetPassword(
		user: UserInstanceInterface,
		newPassword: string
	): Promise<UserInstanceInterface | null> {
		if (!this.validatePassword(newPassword)) {
			throw new this.errorHandler.ErrorClasses.PasswordValidationError(
				'Password does not meet security requirements',
				{ exposeToClient: true }
			);
		}
		const hashedPassword = await hashPassword(newPassword);
		user.password = hashedPassword;
		user.resetPasswordToken = null;
		user.resetPasswordExpires = null;

		await user.save();
		return user as UserInstanceInterface;
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

			const cleanUpdatedDetails = this.removeUndefinedFields(
				updatedDetails
			) as Partial<{
				id?: string;
				userId?: number;
				username?: string;
				password?: string;
				email?: string;
				isVerified?: boolean;
				isMfaEnabled?: boolean;
				creationDate?: Date;
			}>;

			const updatedUser = await fullUser.update(cleanUpdatedDetails);
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
		const jwtSecret = this.secrets.retrieveSecrets('JWT_SECRET');
		if (typeof jwtSecret !== 'string') {
			throw new Error('Invalid JWT secret');
		}

		const jwt = await this.loadJwt();
		const confirmationToken = jwt.sign({ id: user.id }, jwtSecret, {
			expiresIn: '1d'
		});

		const confirmationUrl = `http://localhost:${this.configService.getEnvVariable('serverPort')}/api/users/confirm/${confirmationToken}`;

		const mailOptions = {
			from: this.configService.getEnvVariable('emailUser'),
			to: user.email,
			subject: 'Please Confirm Your Account',
			html: `<p>Hi ${user.username},</p><p>Please confirm your account by clicking the following link:</p><a href="${confirmationUrl}">Confirm Account</a>`
		};

		const transporter = await this.mailer.getTransporter();
		await transporter.sendMail(mailOptions);

		this.logger.info(`Confirmation email sent to ${user.email}`);
	}

	public async deleteUser(userId: string): Promise<void> {
		try {
			const user = await this.userModel.findOne({
				where: { id: userId }
			});
			if (!user) {
				this.logger.warn(`User with id ${userId} not found`);
				return;
			}
			await user.destroy();
			this.logger.info(`User with id ${userId} deleted successfully`);
		} catch (error) {
			this.errorLogger.logError(`Error deleting user\n${String(error)}`);
			this.errorHandler.handleError({ error });
		}
	}

	public async generateTOTP(
		userId: string
	): Promise<{ secret: string; qrCodeUrl: string }> {
		try {
			const user = await this.findUserById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			const totpMfa = await this.loadTotpMfa();
			const { base32, otpauth_url } = totpMfa.generateTOTPSecret();
			const qrCodeUrl = await totpMfa.generateQRCode(otpauth_url);

			user.resetPasswordToken = base32;
			await user.save();

			this.logger.info(`TOTP secret generated for user ${user.email}`);
			return { secret: base32, qrCodeUrl };
		} catch (error) {
			this.errorLogger.logError(
				`Error generating TOTP: ${String(error)}`
			);
			throw error;
		}
	}

	public async verifyTOTP(userId: string, token: string): Promise<boolean> {
		try {
			const user = await this.findUserById(userId);
			if (!user) {
				throw new Error('User not found');
			}

			const totpMfa = await this.loadTotpMfa();
			const isValid = totpMfa.verifyTOTPToken(
				user.resetPasswordToken!,
				token
			);

			if (isValid) {
				this.logger.info(
					`TOTP verified successfully for user ${user.email}`
				);
			} else {
				this.logger.warn(`Invalid TOTP for user ${user.email}`);
			}

			return isValid;
		} catch (error) {
			this.errorLogger.logError(`Error verifying TOTP: ${String(error)}`);
			throw error;
		}
	}

	public async recoverPassword(email: string): Promise<void> {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new Error('User not found');
			}

			const resetToken = await this.loadUuidv4();
			user.resetPasswordToken = resetToken;
			user.resetPasswordExpires = new Date(Date.now() + 1800000); // 30 mins
			await user.save();

			// Send recovery email
			const transporter = await this.mailer.getTransporter();
			await transporter.sendMail({
				to: user.email,
				subject: 'Password Reset Request',
				text: `Here is your password reset token: ${resetToken}. It expires in 30 minutes.`
			});

			this.logger.info(`Password reset email sent to ${user.email}`);
		} catch (error) {
			this.errorLogger.logError(
				`Error in password recovery: ${String(error)}`
			);
			throw error;
		}
	}

	public async generateEmail2FA(email: string): Promise<void> {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new Error('User not found');
			}

			const bcrypt = await import('bcrypt');
			const jwt = await this.loadJwt();
			const email2FAUtil = await createEmail2FAUtil({
				bcrypt,
				jwt,
				validateDependencies
			});
			const { email2FAToken } = await email2FAUtil.generateEmail2FACode();

			user.resetPasswordToken = email2FAToken;
			user.resetPasswordExpires = new Date(Date.now() + 30 * 60000); // 30 minutes
			await user.save();

			const transporter = await this.mailer.getTransporter();
			await transporter.sendMail({
				to: user.email,
				subject: 'Your Login Code',
				text: `Your 2FA code is ${email2FAToken}`
			});

			this.logger.info(`2FA email sent to ${user.email}`);
		} catch (error) {
			this.errorLogger.logError(`Error generating 2FA: ${String(error)}`);
			throw error;
		}
	}

	public async verifyEmail2FA(
		email: string,
		email2FACode: string
	): Promise<boolean> {
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				throw new Error('User not found');
			}

			const resetPasswordToken = user.resetPasswordToken || '';
			const bcrypt = await import('bcrypt');
			const jwt = await this.loadJwt();
			const email2FAUtil = await createEmail2FAUtil({
				bcrypt,
				jwt,
				validateDependencies
			});

			const isEmail2FACodeValid = await email2FAUtil.verifyEmail2FACode(
				resetPasswordToken,
				email2FACode
			);

			if (!isEmail2FACodeValid) {
				this.logger.warn(
					`Invalid or expired 2FA code for user ${user.email}`
				);
			}

			return isEmail2FACodeValid;
		} catch (error) {
			this.errorLogger.logError(`Error verifying 2FA: ${String(error)}`);
			throw error;
		}
	}
}
