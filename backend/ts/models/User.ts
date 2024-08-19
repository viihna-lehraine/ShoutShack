import argon2 from 'argon2';
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';
import getSecrets from '../config/secrets.js';

interface UserAttributes {
	userid: string;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken?: string | null;
	resetPasswordExpires?: Date | null;
	has2FA: boolean;
	backupCodes?: string[] | null;
	isEmail2faEnabled: boolean;
	isTotpl2faEnabled: boolean;
	isYubicoOtp2faEnabled: boolean;
	isU2f2faEnabled: boolean;
	isPasskeyEnabled: boolean;
	totpSecret?: string | null;
	yubicoOtpPublicId?: string | null;
	yubicoOtpSecretKey?: string | null;
	fido2CredentialId?: string | null;
	fido2PublicKey?: string | null;
	fido2Counter?: number | null;
	fido2AttestationFormat?: string | null;
	passkeyCredentialId?: string | null;
	passkeyPublicKey?: string | null;
	passkeyCounter?: number | null;
	passkeyAttestationFormat?: string | null;
	hibpCheckFailed: boolean;
	isGuestbookIndexed: boolean;
	isUserOptedInForDataShare: boolean;
	guestbookProfile?: object | null;
	customStyles?: string | null;
	created_at: Date;
}

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> implements UserAttributes {
	// Fields in the User model
	userid!: string;
	username!: string;
	password!: string;
	email!: string;
	isAccountVerified!: boolean;
	resetPasswordToken!: string | null;
	resetPasswordExpires!: Date | null;
	has2FA!: boolean;
	backupCodes!: string[] | null;
	isEmail2faEnabled!: boolean;
	isTotpl2faEnabled!: boolean;
	isYubicoOtp2faEnabled!: boolean;
	isU2f2faEnabled!: boolean;
	isPasskeyEnabled!: boolean;
	totpSecret!: string | null;
	yubicoOtpPublicId!: string | null;
	yubicoOtpSecretKey!: string | null;
	fido2CredentialId!: string | null;
	fido2PublicKey!: string | null;
	fido2Counter!: number | null;
	fido2AttestationFormat!: string | null;
	passkeyCredentialId!: string | null;
	passkeyPublicKey!: string | null;
	passkeyCounter!: number | null;
	passkeyAttestationFormat!: string | null;
	hibpCheckFailed!: boolean;
	isGuestbookIndexed!: boolean;
	isUserOptedInForDataShare!: boolean;
	guestbookProfile!: object | null;
	customStyles!: string | null;
	created_at!: CreationOptional<Date>;

	// Method to compare passwords
	async comparePassword(password: string): Promise<boolean> {
		const secrets = await getSecrets();
		return await argon2.verify(this.password, password + secrets.PEPPER);
	}

	// Static method to validate passwords
	static validatePassword(password: string): boolean {
		const isValidLength = password.length >= 8 && password.length <= 128;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		const hasSpecial = /[^A-Za-z0-9]/.test(password);

		return isValidLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial;
	}
}

// Initialize the User model
async function initializeUserModel(): Promise<typeof User> {
	const secrets = await getSecrets();
	const sequelize = await initializeDatabase();

	User.init(
		{
			userid: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			username: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			isAccountVerified: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			resetPasswordToken: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			resetPasswordExpires: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			has2FA: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true,
			},
			isEmail2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			isTotpl2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			isYubicoOtp2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			isU2f2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			isPasskeyEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			totpSecret: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			yubicoOtpPublicId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			yubicoOtpSecretKey: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			fido2CredentialId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			fido2PublicKey: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			fido2Counter: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			fido2AttestationFormat: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			passkeyCredentialId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true,
			},
			passkeyPublicKey: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			passkeyCounter: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			passkeyAttestationFormat: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			hibpCheckFailed: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			isGuestbookIndexed: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			isUserOptedInForDataShare: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			guestbookProfile: {
				type: DataTypes.JSON,
				allowNull: true,
			},
			customStyles: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			created_at: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'User',
			timestamps: false,
			hooks: {
				beforeCreate: async (user: User) => {
					user.password = await argon2.hash(user.password + secrets.PEPPER, {
						type: argon2.argon2id,
						memoryCost: 48640, // 47.5 MiB memory
						timeCost: 4, // 4 iterations
						parallelism: 1,
					});
				},
			},
		}
	);

	await User.sync();
	return User;
}

const UserModelPromise = initializeUserModel();
export default UserModelPromise;