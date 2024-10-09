import { User } from '../models/User';
import { validateDependencies } from '../utils/helpers';
import {
	AppLoggerServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	MailerServiceInterface,
	PasswordServiceInterface,
	UserControllerDeps,
	UserControllerInterface,
	VaultServiceInterface
} from '../index/interfaces/main';
import {
	UserAttributesInterface,
	UserInstanceInterface
} from '../index/interfaces/models';
import { InferAttributes, WhereOptions } from 'sequelize';
import { AuthServiceFactory } from '../index/factory/subfactories/AuthServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { EnvConfigServiceFactory } from '../index/factory/subfactories/EnvConfigServiceFactory';
import { VaultServiceFactory } from '../index/factory/subfactories/VaultServiceFactory';
import { PreHTTPSFactory } from '../index/factory/subfactories/PreHTTPSFactory';

export class UserController implements UserControllerInterface {
	private static instance: UserController | null = null;
	private passwordService: PasswordServiceInterface;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private envConfig: EnvConfigServiceInterface;
	private vault: VaultServiceInterface;
	private mailer: MailerServiceInterface;
	private userModel: typeof User;

	private constructor(
		passwordService: PasswordServiceInterface,
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		envConfig: EnvConfigServiceInterface,
		secrets: VaultServiceInterface,
		mailer: MailerServiceInterface,
		userModel: typeof User = User
	) {
		this.passwordService = passwordService;
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.envConfig = envConfig;
		this.vault = secrets;
		this.mailer = mailer;
		this.userModel = userModel;

		validateDependencies(
			[{ name: 'userModel', instance: this.userModel }],
			this.logger
		);
	}

	public static async getInstance(): Promise<UserController> {
		if (!UserController.instance) {
			const passwordService =
				await AuthServiceFactory.getPasswordService();
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const envConfig =
				await EnvConfigServiceFactory.getEnvConfigService();
			const secrets = await VaultServiceFactory.getVaultService();
			const mailer = await PreHTTPSFactory.getMailerService();

			UserController.instance = new UserController(
				passwordService,
				logger,
				errorLogger,
				errorHandler,
				envConfig,
				secrets,
				mailer
			);
		}
		return UserController.instance;
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
			isMFAEnabled: user.isMFAEnabled,
			totpSecret: user.totpSecret,
			emailMFAToken: user.emailMFAToken,
			emailMFATokenExpires: user.emailMFATokenExpires,
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

	public async findUserByEmail(
		email: string
	): Promise<UserInstanceInterface | null> {
		const user = await this.userModel.findOne({ where: { email } });
		if (!user) {
			return null;
		}

		return this.mapToUserInstance(user);
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

			const pepper = this.vault.retrieveSecret(
				'PEPPER',
				secret => secret
			);

			if (!pepper || typeof pepper !== 'string') {
				throw new this.errorHandler.ErrorClasses.ServiceUnavailableError(
					10,
					'Invalid pepper',
					{ exposeToClient: false }
				);
			}

			const hashedPassword = await this.passwordService.hashPassword(
				userDetails.password,
				pepper
			);
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

			const pepper = this.vault.retrieveSecret(
				'PEPPER',
				secret => secret
			);

			if (!pepper || typeof pepper !== 'string') {
				throw new this.errorHandler.ErrorClasses.ServiceUnavailableError(
					10,
					'Invalid pepper',
					{ exposeToClient: false }
				);
			}

			if (updatedDetails.password) {
				const hashedPassword = await this.passwordService.hashPassword(
					updatedDetails.password,
					pepper
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
			const jwtSecret = this.vault.retrieveSecret(
				'JWT_SECRET',
				secret => secret
			);

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

			const baseUrl = this.envConfig.getEnvVariable('baseUrl');
			const port = this.envConfig.getEnvVariable('serverPort');
			const confirmationUrl = `${baseUrl}${port}/api/users/confirm/${confirmationToken}`;

			const mailOptions = {
				from: this.envConfig.getEnvVariable('emailUser'),
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

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down UserController...');

			UserController.instance = null;

			this.logger.info('UserController shutdown completed.');
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during UserController shutdown: ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}

	protected async loadAxios(): Promise<UserControllerDeps['axios']> {
		return (await import('axios')).default;
	}

	private async loadJwt(): Promise<UserControllerDeps['jwt']> {
		return (await import('jsonwebtoken')).default;
	}

	private async loadUuidv4(): Promise<string> {
		const { v4: uuidv4 } = await import('uuid');
		return uuidv4();
	}

	private async loadZxcvbn(): Promise<UserControllerDeps['zxcvbn']> {
		return (await import('zxcvbn')).default;
	}
}
