import { execSync } from 'child_process';
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
import { hashPassword } from '../config/hashConfig';
import { Logger } from '../config/logger';
import { PasswordValidationError } from '../config/errorClasses';
import createRateLimitMiddleware, {
	RateLimitMiddlewareDependencies
} from '../middleware/rateLimit';
import sops, { SecretsMap } from '../utils/sops';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';

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

type UserSecrets = Pick<SecretsMap, 'PEPPER'>;

interface UserModelDependencies {
	argon2: typeof import('argon2');
	uuidv4: typeof uuidv4;
	getSecrets: () => Promise<UserSecrets>;
}

export class User
	extends Model<InferAttributes<User>, InferCreationAttributes<User>>
	implements UserAttributes
{
	id!: string;
	userId!: number;
	username!: string;
	password!: string;
	email!: string;
	isAccountVerified!: boolean;
	resetPasswordToken!: string | null;
	resetPasswordExpires!: Date | null;
	isMfaEnabled!: boolean;
	creationDate!: CreationOptional<Date>;

	async comparePassword(
		password: string,
		argon2: typeof import('argon2'),
		secrets: UserSecrets,
		logger: Logger
	): Promise<boolean> {
		try {
			validateDependencies(
				[
					{ name: 'password', instance: password },
					{ name: 'argon2', instance: argon2 },
					{ name: 'secrets', instance: secrets },
					{ name: 'logger', instance: logger }
				],
				logger || console
			);

			return await argon2.verify(
				this.password,
				password + secrets.PEPPER
			);
		} catch (error) {
			handleGeneralError(error, logger || console);
			throw new PasswordValidationError('Passwords do not match');
		}
	}

	static validatePassword(password: string, logger: Logger): boolean {
		try {
			validateDependencies(
				[
					{ name: 'password', instance: password },
					{ name: 'logger', instance: logger }
				],
				logger || console
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
		} catch (error) {
			handleGeneralError(error, logger || console);
			return false;
		}
	}

	static async createUser(
		{ uuidv4, getSecrets }: UserModelDependencies,
		userId: number,
		username: string,
		password: string,
		email: string,
		rateLimitDependencies: RateLimitMiddlewareDependencies,
		logger: Logger
	): Promise<User> {
		try {
			validateDependencies(
				[
					{ name: 'uuidv4', instance: uuidv4 },
					{ name: 'getSecrets', instance: getSecrets },
					{
						name: 'rateLimitDependencies',
						instance: rateLimitDependencies
					},
					{ name: 'logger', instance: logger }
				],
				logger || console
			);

			const rateLimiter = createRateLimitMiddleware(
				rateLimitDependencies
			);
			const req = { ip: email } as unknown as Request;
			const res = {} as unknown as Response;

			await new Promise<void>((resolve, reject) => {
				rateLimiter(req, res, err => (err ? reject(err) : resolve()));
			});

			const isValidPassword = User.validatePassword(password, logger);
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
			const hashedPassword = await hashPassword({
				password,
				secrets,
				logger
			});
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
			handleGeneralError(error, logger || console);

			if (error instanceof PasswordValidationError) {
				throw error;
			}

			throw new PasswordValidationError(
				'There was an error creating your account. Please try again. If the issue persists, please contact support.'
			);
		}
	}

	static async comparePasswords(
		hashedPassword: string,
		password: string,
		argon2: typeof import('argon2'),
		secrets: UserSecrets,
		logger: Logger
	): Promise<boolean> {
		try {
			validateDependencies(
				[
					{ name: 'argon2', instance: argon2 },
					{ name: 'secrets', instance: secrets },
					{ name: 'logger', instance: logger }
				],
				logger || console
			);

			const isValid = await argon2.verify(
				hashedPassword,
				password + secrets.PEPPER
			);

			logger.debug('Password verified successfully');
			return isValid;
		} catch (error) {
			handleGeneralError(error, logger || console);

			if (error instanceof Error) {
				throw new PasswordValidationError('Error verifying password');
			} else {
				throw new PasswordValidationError(
					'Unknown error verifying password'
				);
			}
		}
	}
}

export default function createUserModel(
	sequelize: Sequelize,
	logger: Logger
): typeof User {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
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
				const secrets = await sops.getSecrets({
					logger,
					execSync,
					getDirectoryPath: () => process.cwd()
				});
				user.password = await hashPassword({
					password: user.password,
					secrets,
					logger
				});
			} catch (error) {
				handleGeneralError(error, logger || console);
				throw new PasswordValidationError('Error hashing password.');
			}
		});

		User.addHook('afterUpdate', async (user: User) => {
			try {
				if (user.changed('isMfaEnabled')) {
					const UserMfa = await (
						await import('./UserMfa')
					).default(sequelize, logger);
					await UserMfa.update(
						{ isMfaEnabled: user.isMfaEnabled },
						{ where: { id: user.id } }
					);
					logger.debug('MFA status updated successfully');
				}
			} catch (error) {
				handleGeneralError(error, logger || console);
				throw new PasswordValidationError(
					'Error updating multi-factor authentication status.'
				);
			}
		});

		return User;
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw error;
	}
}
