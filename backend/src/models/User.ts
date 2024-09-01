import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize,
	DataTypes
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { SecretsMap } from '../utils/sops';

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

class User
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

	async comparePassword(
		password: string,
		argon2: typeof import('argon2'),
		secrets: UserSecrets
	): Promise<boolean> {
		return argon2.verify(this.password, password + secrets.PEPPER);
	}

	static async comparePasswordWithDependencies(
		hashedPassword: string,
		password: string,
		argon2: typeof import('argon2'),
		secrets: UserSecrets
	): Promise<boolean> {
		return argon2.verify(hashedPassword, password + secrets.PEPPER);
	}

	// Static method to validate passwords
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

	// Static method to create a new user, now taking dependencies as arguments
	static async createUser(
		{ argon2, uuidv4, getSecrets }: UserModelDependencies,
		username: string,
		password: string,
		email: string
	): Promise<User> {
		const isValidPassword = User.validatePassword(password);
		if (!isValidPassword) {
			throw new Error(
				'Password does not meet the security requirements.'
			);
		}

		const secrets = await getSecrets();
		const hashedPassword = await argon2.hash(password + secrets.PEPPER);

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
	}
}

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
			timestamps: false
		}
	);

	return User;
}
