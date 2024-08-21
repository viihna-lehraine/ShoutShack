import argon2 from 'argon2';
import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
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
			throw new Error(
				'Password does not meet the security requirements.'
			);
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
			creationDate: new Date()
		});

		return newUser;
	}
}

export default User;
