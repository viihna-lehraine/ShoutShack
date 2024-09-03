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

// Attributes for the User model
interface UserAttributes {
	id: string; // UUID for the user record, primary key
	userId: number; // auto-incremented user identifier
	username: string; // unique username for the user
	password: string; // hashed password for the user
	email: string; // unique email address for the user
	isAccountVerified: boolean; // boolean flag for account verification status
	resetPasswordToken?: string | null; // optional reset password token
	resetPasswordExpires?: Date | null; // optional expiry date for reset password token
	isMfaEnabled: boolean; // boolean flag for MFA status
	creationDate: Date; // timestamp for when the user record was created
}

// Secrets required for the User model
type UserSecrets = Pick<SecretsMap, 'PEPPER'>;

// Required for certain User model methods
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
	id!: string; // initialized as a non-nullable string (UUID)
	userId!: number; // initialized as an optional auto-incremented integer
	username!: string; // initialized as a non-nullable string
	password!: string; // initialized as a non-nullable string
	email!: string; // initialized as a non-nullable string
	isAccountVerified!: boolean; // initialized as a non-nullable boolean
	resetPasswordToken!: string | null; // initialized as an optional string
	resetPasswordExpires!: Date | null; // initialized as an optional date
	isMfaEnabled!: boolean; // initialized as a non-nullable boolean
	creationDate!: Date; // initialized as a non-nullable date

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
				throw new PasswordValidationError('Passwords do not match');
			} else {
				logger.error(`Error comparing passwords:`, {
					error
				});
				throw new PasswordValidationError('Passwords do not match');
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
		userId: number,
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
					'Password does not meet security requirements. Please make sure your password is between 8 and 128 characters long, contains at least one uppercase letter, one lowercase letter, one number, and one special character.'
				);
			}

			logger.debug('Password is valid. Proceeding with user creation.');

			const secrets = await getSecrets();
			const hashedPassword = await hashPassword(password, secrets);
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
		} catch (error) {
			if (error instanceof PasswordValidationError) {
				logger.warn(
					`Validation error during user creation: ${error.message}`
				);
				throw error;
			}

			if (error instanceof Error) {
				logger.error(`Error creating new user: `, {
					stack: error.stack
				});
			} else {
				logger.error(`Unknown error creating user: `, {
					error
				});
			}

			throw new PasswordValidationError(
				'There was an error creating your account. Please try again. If the issue persists, please contact support.'
			);
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
			logger.debug('Password verified successfully');
			return await argon2.verify(
				hashedPassword,
				password + secrets.PEPPER
			);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error comparing passwords:`, {
					stack: error.stack
				});
				throw new PasswordValidationError('Error verifying password');
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
				defaultValue: () => uuidv4(), // generate UUID for new user
				allowNull: false,
				primaryKey: true,
				unique: true
			},
			userId: {
				type: DataTypes.INTEGER,
				autoIncrement: true, // auto-increment user ID
				allowNull: false,
				unique: true
			},
			username: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true // ensure username is unique
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true // ensure email is unique
			},
			isAccountVerified: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false // default to unverified account
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
				defaultValue: false // default to false (MFA disabled)
			},
			creationDate: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW // set to current date/time
			}
		},
		{
			sequelize,
			tableName: 'Users', // table name in database
			timestamps: true, // automatically manage timestamps
			hooks: {
				// hook to hash the user's password before creating a new user
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
						// handle errors during password hashing
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
					// hook to update MFA status after updating user record
					try {
						if (user.changed('isMfaEnabled')) {
							const UserMfa = await (
								await import('./UserMfa')
							).default(sequelize);
							await UserMfa.update(
								{ isMfaEnabled: user.isMfaEnabled },
								{ where: { id: user.id } }
							);
							logger.debug('MFA status updated successfully');
						}
					} catch (error) {
						if (error instanceof Error) {
							logger.error(`Error updating MFA status:`, {
								stack: error.stack
							});
							throw new PasswordValidationError(
								'Error updating multi-factor authentication status. Please try again. If the issue persists, please contact support.'
							);
						} else {
							logger.error(`Unknown error updating MFA status:`, {
								error
							});
							throw new PasswordValidationError(
								'Unknown error updating multi-factor authentication status. Please try again. If the issue persists, please contact support.'
							);
						}
					}
				}
			}
		}
	);

	return User;
}
