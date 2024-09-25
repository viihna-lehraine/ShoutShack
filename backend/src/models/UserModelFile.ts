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
import { hashPassword } from '../auth/hash';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { envSecretsStore } from '../environment/envSecrets';
import { initializeRateLimitMiddleware } from '../middleware/rateLimit';
import { validateDependencies } from '../utils/helpers';

interface UserAttributes {
	id: string;
	userId: number;
	username: string;
	password: string;
	email: string;
	isVerified: boolean;
	resetPasswordToken?: string | null;
	resetPasswordExpires?: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
}

interface UserModelDependencies {
	argon2: typeof import('argon2');
	uuidv4: typeof uuidv4;
}

const logger = configService.getAppLogger();
const errorLogger = configService.getErrorLogger();

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
		try {
			validateDependencies(
				[
					{ name: 'password', instance: password },
					{ name: 'argon2', instance: argon2 }
				],
				logger
			);

			const pepper = envSecretsStore.retrieveSecret('PEPPER');
			return await argon2.verify(this.password, password + pepper);
		} catch (passwordError) {
			const passwordValidationError =
				new errorHandler.ErrorClasses.PasswordValidationError(
					'Passwords do not match',
					{ exposeToClient: true }
				);
			errorLogger.logInfo(passwordValidationError.message);
			errorHandler.handleError({
				error: passwordError || passwordValidationError
			});
			return null;
		} finally {
			logger.debug('Password verified successfully');
			envSecretsStore.reEncryptSecret('PEPPER');
		}
	}

	static validatePassword(password: string): boolean {
		try {
			validateDependencies(
				[{ name: 'password', instance: password }],
				logger
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
				new errorHandler.ErrorClasses.PasswordValidationError(
					'Error validating password',
					{ exposeToClient: true }
				);
			errorLogger.logInfo(passwordValidationError.message);
			errorHandler.handleError({
				error: passwordError || passwordValidationError
			});
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
		try {
			validateDependencies(
				[
					{ name: 'uuidv4', instance: uuidv4 },
					{ name: 'userId', instance: userId },
					{ name: 'username', instance: username },
					{ name: 'password', instance: password },
					{ name: 'email', instance: email }
				],
				logger
			);

			const rateLimiter = initializeRateLimitMiddleware();
			const req = { ip: email } as unknown as Request;
			const res = {} as unknown as Response;

			await new Promise<void>((resolve, reject) => {
				rateLimiter(req, res, err => (err ? reject(err) : resolve()));
			});

			const isValidPassword = User.validatePassword(password);
			if (!isValidPassword) {
				logger.warn(
					'Password does not meet the security requirements.'
				);

				const validationError =
					new errorHandler.ErrorClasses.PasswordValidationError(
						`Client password validation error: Password does not meet security requirements\n${Error instanceof Error ? Error.message : 'Unknown error'}`,
						{
							exposeToClient: false
						}
					);
				await errorHandler.sendClientErrorResponse({
					message:
						'Password does not meet security requirements. Please make sure your password is between 8 and 128 characters long, contains at least one uppercase letter, one lowercase letter, one number, and one special character.',
					statusCode: 400,
					res
				});
				throw validationError;
			}

			const hashedPassword = await hashPassword(password);

			const newUser = await User.create({
				id: uuidv4(),
				userId,
				username,
				password: hashedPassword,
				email,
				isVerified: false,
				resetPasswordToken: null,
				resetPasswordExpires: null,
				isMfaEnabled: false,
				creationDate: new Date()
			});

			return newUser;
		} catch (regisrationError) {
			const userRegistrationError =
				new errorHandler.ErrorClasses.UserRegistrationError(
					'There was an error creating your account. Please try again. If the issue persists, please contact support.',
					{ exposeToClient: true }
				);
			errorLogger.logWarn(userRegistrationError.message);
			errorHandler.handleError({
				error: regisrationError || userRegistrationError
			});
			return null;
		}
	}

	static async comparePasswords(
		hashedPassword: string,
		password: string,
		argon2: typeof import('argon2')
	): Promise<boolean | null> {
		try {
			validateDependencies(
				[{ name: 'argon2', instance: argon2 }],
				logger
			);

			const pepper = envSecretsStore.retrieveSecret('PEPPER');
			const isValid = await argon2.verify(
				hashedPassword,
				password + pepper
			);
			envSecretsStore.reEncryptSecret('PEPPER');
			return isValid;
		} catch (passwordError) {
			const passwordValidationError =
				new errorHandler.ErrorClasses.PasswordValidationError(
					'Error verifying password',
					{ exposeToClient: false }
				);
			errorLogger.logInfo(passwordValidationError.message);
			errorHandler.handleError({
				error: passwordValidationError || passwordError
			});
			return null;
		}
	}
}

export function createUserModel(sequelize: Sequelize): typeof User {
	try {
		const appLogger = configService.getAppLogger();

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
				isVerified: {
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
				user.password = await hashPassword(user.password);
			} catch (dbError) {
				const databaseError =
					new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Failed to create hashed password: ${
							dbError instanceof Error
								? dbError.message
								: 'Unknown error'
						}`,
						{
							originalError: dbError
						}
					);
				errorLogger.logInfo(databaseError.message);
				errorHandler.handleError({ error: databaseError || dbError });
				throw databaseError;
			}
		});

		User.addHook('afterUpdate', async (user: User) => {
			try {
				const { UserMfa } = await import('./UserMfaModelFile');

				if (!UserMfa) {
					throw new errorHandler.ErrorClasses.DependencyErrorRecoverable(
						`UserModelFile is missing UserMfa model. Unable to update MFA status\n${Error instanceof Error ? Error.message : 'Unknown error'}`,
						{
							originalError: Error || null
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
						new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
							`UserMfa update method is not available\n${Error instanceof Error ? Error.message : 'Unknown error'}`,
							{ originalError: Error || null }
						);
					errorLogger.logInfo(databaseError.message);
					errorHandler.handleError({
						error: databaseError || Error || null
					});
					throw databaseError;
				}
			} catch (dbError) {
				const databaseError =
					new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Failed to update MFA status\n${
							dbError instanceof Error
								? dbError.message
								: 'Unknown error'
						}`,
						{ originalError: dbError }
					);
				errorLogger.logError(databaseError.message);
				errorHandler.handleError({
					error: databaseError || dbError || Error || null
				});
			}
		});

		return User;
	} catch (dbError) {
		const databaseRecoverableError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize User model: ${
					dbError instanceof Error ? dbError.message : 'Unknown error'
				}`,
				{ originalError: dbError || Error || null }
			);
		errorLogger.logInfo(databaseRecoverableError.message);
		errorHandler.handleError({
			error: databaseRecoverableError || dbError || Error || null
		});
		throw databaseRecoverableError;
	}
}
