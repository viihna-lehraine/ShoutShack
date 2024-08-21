import argon2 from 'argon2';
import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/db'; // assuming this is where you import the initialized sequelize instance
import getSecrets from '../config/secrets';

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

// Fields in the User model
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

	// Method to compare passwords
	async comparePassword(password: string): Promise<boolean> {
		const secrets = await getSecrets();
		return argon2.verify(this.password, password + secrets.PEPPER);
	}

	// Static method to validate passwords
	static validatePassword(password: string): boolean {
		const isValidLength = password.length >= 8 && password.length <= 128;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		const hasSpecial = /[^A-Za-z0-9]/.test(password);

		return (
			isValidLength &&
			hasUpperCase &&
			hasLowerCase &&
			hasNumber &&
			hasSpecial
		);
	}

	// Static method to create a new user
	static async createUser(
		username: string,
		password: string,
		email: string
	): Promise<User> {
		const isValidPassword = User.validatePassword(password);
		if (!isValidPassword) {
			throw new Error('Password does not meet the security requirements.');
		}

		const newUser = await User.create({
			id: uuidv4(),
			username,
			password,
			email,
			isAccountVerified: false,
			resetPasswordToken: null,
			resetPasswordExpires: null,
			isMfaEnabled: false,
			creationDate: new Date(),
		});

		return newUser;
	}
}

// Initialize the User model

User.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
			allowNull: false,
			unique: true
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
			defaultValue: false
		},
		resetPasswordToken: {
			type: DataTypes.STRING,
			defaultValue: null,
			allowNull: true
		},
		resetPasswordExpires: {
			type: DataTypes.DATE,
			defaultValue: null,
			allowNull: true
		},
		isMfaEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false
		},
		creationDate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
			allowNull: false
		}
	},
	{
		sequelize: sequelize!, // Using the non-null assertion here
		modelName: 'User',
		timestamps: false,
		hooks: {
			beforeCreate: async (user: User) => {
				const secrets = await getSecrets(); // Fetch secrets inside the hook
				user.password = await argon2.hash(
					user.password + secrets.PEPPER,
					{
						type: argon2.argon2id,
						memoryCost: 48640, // 47.5 MiB memory
						timeCost: 4, // 4 iterations
						parallelism: 1,
					}
				);
			},
		},
	}
);

export default User;
