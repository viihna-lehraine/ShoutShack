import { execSync } from 'child_process';
import { Request, Response } from 'express';
import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../config/hashConfig';
import { Logger, setupLogger } from '../config/logger';
import { PasswordValidationError } from '../errors/PasswordError';
import createRateLimitMiddleware, {
	RateLimitMiddlewareDependencies
} from '../middleware/rateLimit';
import sops, { SecretsMap } from '../utils/sops';

interface UserAttributes {
	id: string;
	userid?: number;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken?: string | null;
	resetPasswordExpires?: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
}

type UserSecrets = Pick<SecretsMap, 'PEPPER'>;

interface UserModelDependencies {
	argon2: typeof import('argon2');
	uuidv4: typeof uuidv4;
	getSecrets: () => Promise<UserSecrets>;
}

const logger: Logger = setupLogger();

// User model definition including attributes and static methods
export class User
	extends Model<InferAttributes<User>, InferCreationAttributes<User>>
	implements UserAttributes
{
	id!: string;
	userid?: number;
	username!: string;
	password!: string;
	email!: string;
	isAccountVerified!: boolean;
	resetPasswordToken!: string | null;
	resetPasswordExpires!: Date | null;
	isMfaEnabled!: boolean;
	creationDate!: Date;

	// instance method to compare passwords
	async comparePassword(
		password: string,
		argon2: typeof import('argon2'),
		secrets: UserSecrets
	): Promise<boolean> {
		try {
			return await argon2.verify(
				this.password,
				password + secrets.PEPPER
			);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error comparing passwords:`, {
					stack: error.stack
				});
				throw new PasswordValidationError('Error verifying passwords.');
			} else {
				logger.error(`Error comparing passwords:`, {
					error
				});
				throw new PasswordValidationError('Error verifying passwords');
			}
		}
	}

	// static method to validate passwords
	static validatePassword(password: string): boolean {
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

	// static method to create a new user
	static async createUser(
		{ uuidv4, getSecrets }: UserModelDependencies,
		username: string,
		password: string,
		email: string,
		rateLimitDependencies: RateLimitMiddlewareDependencies
	): Promise<User> {
		const rateLimiter = createRateLimitMiddleware(rateLimitDependencies);
		const req = { ip: email } as unknown as Request;
		const res = {} as unknown as Response;

		try {
			await new Promise<void>((resolve, reject) => {
				rateLimiter(req, res, err => (err ? reject(err) : resolve()));
			});

			const isValidPassword = User.validatePassword(password);
			if (!isValidPassword) {
				logger.warn(
					'Password does not meet the security requirements.'
				);
				throw new PasswordValidationError(
					'Password does not meet the security requirements.'
				);
			}

			const secrets = await getSecrets();
			const hashedPassword = await hashPassword(password, secrets);
			const newUser = await User.create({
				id: uuidv4(),
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
		} catch (error) {
			if (error instanceof PasswordValidationError) {
				logger.warn(
					`Validation error during user creation: ${error.message}`
				);
				throw error;
			}

			if (error instanceof Error) {
				logger.error(`Error creating user:`, {
					stack: error.stack
				});
			} else {
				logger.error(`Unknown error creating user:`, {
					error
				});
			}

			throw new PasswordValidationError('Error creating user.');
		}
	}

	// static method to compare hashed passwords with dependencies
	static async comparePasswordWithDependencies(
		hashedPassword: string,
		password: string,
		argon2: typeof import('argon2'),
		secrets: UserSecrets
	): Promise<boolean> {
		try {
			return await argon2.verify(
				hashedPassword,
				password + secrets.PEPPER
			);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error comparing passwords:`, {
					stack: error.stack
				});
				throw new PasswordValidationError('Error verifying passwords.');
			} else {
				logger.error(`Error comparing passwords:`, {
					error
				});
				throw new PasswordValidationError('Error verifying password');
			}
		}
	}
}

// User model initialization function
export default function createUserModel(sequelize: Sequelize): typeof User {
	User.init(
		{
			id: {
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			userid: {
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
			timestamps: false,
			hooks: {
				beforeCreate: async (user: User) => {
					try {
						const secrets = await sops.getSecrets({
							logger,
							execSync,
							getDirectoryPath: () => process.cwd()
						});
						user.password = await hashPassword(
							user.password,
							secrets
						);
					} catch (error) {
						if (error instanceof Error) {
							logger.error(`Error hashing password:`, {
								stack: error.stack
							});
							throw new PasswordValidationError(
								'Error hashing password.'
							);
						} else {
							logger.error(`Unknown error hashing password:`, {
								error
							});
							throw new PasswordValidationError(
								'Unknown error hashing password'
							);
						}
					}
				},
				afterUpdate: async (user: User) => {
					try {
						if (user.changed('isMfaEnabled')) {
							const UserMfa = await (
								await import('./UserMfa')
							).default(sequelize);
							await UserMfa.update(
								{ isMfaEnabled: user.isMfaEnabled },
								{ where: { id: user.id } }
							);
						}
					} catch (error) {
						if (error instanceof Error) {
							logger.error(`Error updating MFA status:`, {
								stack: error.stack
							});
							throw new PasswordValidationError(
								'Error updating MFA status.'
							);
						} else {
							logger.error(`Unknown error updating MFA status:`, {
								error
							});
							throw new PasswordValidationError(
								'Unknown error updating MFA status'
							);
						}
					}
				}
			}
		}
	);

	return User;
}
