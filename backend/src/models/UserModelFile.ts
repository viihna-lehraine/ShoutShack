import { Request, Response } from 'express';
import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { configService } from '../services/configService';
import { hashPassword } from '../auth/hash';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { processError, sendClientErrorResponse } from '../errors/processError';
import { initializeRateLimitMiddleware } from '../middleware/rateLimit';
import { Logger } from '../services/appLogger';
import { ensureSecrets } from '../utils/ensureSecrets';
import { validateDependencies } from '../utils/helpers';

interface UserAttributes {
	id: string;
	userId: number;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken?: string | null;
	resetPasswordExpires?: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
}

interface UserModelDependencies {
	argon2: typeof import('argon2');
	uuidv4: typeof uuidv4;
}

export class User
	extends Model<InferAttributes<User>, InferCreationAttributes<User>>
	implements UserAttributes
{
	public id!: string;
	public userId!: number;
	public username!: string;
	public password!: string;
	public email!: string;
	public isVerified!: boolean;
	public resetPasswordToken!: string | null;
	public resetPasswordExpires!: Date | null;
	public isMfaEnabled!: boolean;
	public creationDate!: CreationOptional<Date>;

	async comparePassword(
		password: string,
		argon2: typeof import('argon2')
	): Promise<boolean | null> {
		const appLogger = configService.getLogger();
		const secrets = ensureSecrets({ subSecrets: ['pepper'] });

		try {
			validateDependencies(
				[
					{ name: 'password', instance: password },
					{ name: 'argon2', instance: argon2 }
				],
				appLogger || console
			);

			return await argon2.verify(
				this.password,
				password + secrets.pepper
			);
		} catch (passwordError) {
			const passwordValidationError =
				new errorClasses.PasswordValidationError(
					'Passwords do not match',
					{ exposeToClient: true }
				);
			ErrorLogger.logInfo(passwordValidationError.message);
			processError(passwordError || passwordValidationError);
			return null;
		}
	}

	static validatePassword(password: string, appLogger: Logger): boolean {
		try {
			validateDependencies(
				[{ name: 'password', instance: password }],
				appLogger || console
			);

			const isValidLength =
				password.length >= 8 && password.length <= 128;
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
		} catch (passwordError) {
			const passwordValidationError =
				new errorClasses.PasswordValidationError(
					'Error validating password',
					{ exposeToClient: true }
				);
			ErrorLogger.logInfo(passwordValidationError.message);
			processError(passwordError || passwordValidationError);
			return false;
		}
	}

	static async createUser(
		{ uuidv4 }: UserModelDependencies,
		userId: number,
		username: string,
		password: string,
		email: string
	): Promise<User | null> {
		const appLogger = configService.getLogger();

		try {
			validateDependencies(
				[
					{ name: 'uuidv4', instance: uuidv4 },
					{ name: 'userId', instance: userId },
					{ name: 'username', instance: username },
					{ name: 'password', instance: password },
					{ name: 'email', instance: email }
				],
				appLogger || console
			);

			const rateLimiter = initializeRateLimitMiddleware();
			const req = { ip: email } as unknown as Request;
			const res = {} as unknown as Response;

			await new Promise<void>((resolve, reject) => {
				rateLimiter(req, res, err => (err ? reject(err) : resolve()));
			});

			const isValidPassword = User.validatePassword(password, appLogger);
			if (!isValidPassword) {
				appLogger.warn(
					'Password does not meet the security requirements.'
				);

				const validationError =
					new errorClasses.PasswordValidationError(
						'Password does not meet security requirements. Please make sure your password is between 8 and 128 characters long, contains at least one uppercase letter, one lowercase letter, one number, and one special character.',
						{
							exposeToClient: true
						}
					);
				await sendClientErrorResponse(validationError, res);
				throw validationError;
			}

			const hashedPassword = await hashPassword({ password });

			const newUser = await User.create({
				id: uuidv4(),
				userId,
				username,
				password: hashedPassword,
				email,
				isAccountVerified: false,
				resetPasswordToken: null,
				resetPasswordExpires: null,
				isMfaEnabled: false,
				creationDate: new Date()
			});

			return newUser;
		} catch (regisrationError) {
			const userRegistrationError =
				new errorClasses.UserRegistrationError(
					'There was an error creating your account. Please try again. If the issue persists, please contact support.',
					{ exposeToClient: true }
				);
			ErrorLogger.logWarning(userRegistrationError.message);
			processError(regisrationError || userRegistrationError);
			return null;
		}
	}

	static async comparePasswords(
		hashedPassword: string,
		password: string,
		argon2: typeof import('argon2')
	): Promise<boolean | null> {
		const appLogger = configService.getLogger();
		const secrets = ensureSecrets({ subSecrets: ['pepper'] });

		try {
			validateDependencies(
				[{ name: 'argon2', instance: argon2 }],
				appLogger || console
			);

			const isValid = await argon2.verify(
				hashedPassword,
				password + secrets.pepper
			);

			appLogger.debug('Password verified successfully');
			return isValid;
		} catch (passwordError) {
			const passwordValidationError =
				new errorClasses.PasswordValidationError(
					'Error verifying password',
					{ exposeToClient: true }
				);
			ErrorLogger.logInfo(passwordValidationError.message);
			processError(passwordError);
			return null;
		}
	}
}

export function createUserModel(sequelize: Sequelize): typeof User {
	try {
		const appLogger = configService.getLogger();

		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			appLogger || console
		);

		User.init(
			{
				id: {
					type: DataTypes.STRING,
					defaultValue: () => uuidv4(),
					allowNull: false,
					primaryKey: true,
					unique: true
				},
				userId: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				username: {
					type: DataTypes.STRING,
					allowNull: false,
					unique: true
				},
				password: {
					type: DataTypes.STRING,
					allowNull: false
				},
				email: {
					type: DataTypes.STRING,
					allowNull: false,
					unique: true
				},
				isAccountVerified: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				resetPasswordToken: {
					type: DataTypes.STRING,
					allowNull: true
				},
				resetPasswordExpires: {
					type: DataTypes.DATE,
					allowNull: true
				},
				isMfaEnabled: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				creationDate: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW
				}
			},
			{
				sequelize,
				tableName: 'Users',
				timestamps: true
			}
		);

		User.addHook('beforeCreate', async (user: User) => {
			try {
				user.password = await hashPassword({ password: user.password });
			} catch (dbError) {
				const databaseError = new errorClasses.DatabaseErrorRecoverable(
					`Failed to create hashed password: ${
						dbError instanceof Error
							? dbError.message
							: 'Unknown error'
					}`,
					{
						originalError: dbError,
						statusCode: 500,
						severity: ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
				ErrorLogger.logInfo(databaseError.message);
				processError(databaseError);
				throw databaseError;
			}
		});

		User.addHook('afterUpdate', async (user: User) => {
			try {
				const { UserMfa } = await import('./UserMfaModelFile');

				if (!UserMfa) {
					throw new errorClasses.DependencyErrorRecoverable(
						`UserModelFile is missing UserMfa model. Unable to update MFA status\n${Error instanceof Error ? Error.message : 'Unknown error'}`,
						{
							originalError: Error || null,
							statusCode: 500,
							severity: ErrorSeverity.FATAL,
							exposeToClient: false
						}
					);
				}

				if (typeof UserMfa.update === 'function') {
					await UserMfa.update(
						{ isMfaEnabled: user.isMfaEnabled },
						{ where: { id: user.id } }
					);
					appLogger.debug('MFA status updated successfully');
				} else {
					const databaseError =
						new errorClasses.DatabaseErrorRecoverable(
							`UserMfa update method is not available\n${Error instanceof Error ? Error.message : 'Unknown error'}`,
							{
								originalError: Error || null,
								statusCode: 500,
								severity: ErrorSeverity.RECOVERABLE,
								exposeToClient: false
							}
						);
					ErrorLogger.logInfo(databaseError.message);
					processError(databaseError);
					throw databaseError;
				}
			} catch (dbError) {
				const databaseError = new errorClasses.DatabaseErrorRecoverable(
					`Failed to update MFA status\n${
						dbError instanceof Error
							? dbError.message
							: 'Unknown error'
					}`,
					{
						originalError: dbError,
						statusCode: 500,
						severity: ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
				ErrorLogger.logError(databaseError);
				processError(databaseError);
			}
		});

		return User;
	} catch (dbError) {
		const databaseRecoverableError =
			new errorClasses.DatabaseErrorRecoverable(
				`Failed to initialize User model: ${
					dbError instanceof Error ? dbError.message : 'Unknown error'
				}`,
				{
					originalError: dbError,
					statusCode: 500,
					severity: ErrorSeverity.RECOVERABLE,
					exposeToClient: false
				}
			);
		ErrorLogger.logInfo(databaseRecoverableError.message);
		processError(databaseRecoverableError);
		throw databaseRecoverableError;
	}
}
