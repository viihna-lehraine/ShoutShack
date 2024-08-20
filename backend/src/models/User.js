import argon2 from 'argon2';
import { DataTypes, Model, Sequelize } from 'sequelize';
import initializeDatabase from '../config/db.js';
import getSecrets from '../config/secrets.js';

class User extends Model {
	async comparePassword(password) {
		const secrets = await getSecrets();
		return await argon2.verify(this.password, password + secrets.PEPPER);
	}
}

// Initialize the User model
async function initializeUserModel() {
	const secrets = await getSecrets();
	const sequelize = await initializeDatabase();

	User.init(
		{
			userid: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
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
				allowNull: true
			},
			resetPasswordExpires: {
				type: DataTypes.DATE,
				allowNull: true
			},
			has2FA: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			isEmail2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isTotpl2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isYubicoOtp2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isU2f2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isPasskeyEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			totpSecret: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true
			},
			yubicoOtpPublicId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true
			},
			yubicoOtpSecretKey: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true
			},
			fido2CredentialId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true
			},
			fido2PublicKey: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			fido2Counter: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			fido2AttestationFormat: {
				type: DataTypes.STRING,
				allowNull: true
			},
			passkeyCredentialId: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true
			},
			passkeyPublicKey: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			passkeyCounter: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			passkeyAttestationFormat: {
				type: DataTypes.STRING,
				allowNull: true
			},
			hibpCheckFailed: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isGuestbookIndexed: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			isUserOptedInForDataShare: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			guestbookProfile: {
				type: DataTypes.JSON,
				allowNull: true
			},
			customStyles: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			created_at: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
				allowNull: false
			}
		},
		{
			sequelize,
			modelName: 'User',
			timestamps: false,
			hooks: {
				beforeCreate: async (user) => {
					user.password = await argon2.hash(
						user.password + secrets.PEPPER,
						{
							type: argon2.argon2id,
							memoryCost: 48640, // 47.5 MiB memory
							timeCost: 4, // 4 iterations
							parallelism: 1
						}
					);
				}
			}
		}
	);

	await User.sync();
}

// Password validation
User.validatePassword = (password) => {
	const isValidLength = password.length >= 8 && password.length <= 128;
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumber = /\d/.test(password);
	const hasSpecial = /[^A-Za-z0-9]/.test(password);

	return (
		isValidLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial
	);
};

// Export a promise that resolves to the User model
const UserModelPromise = (async () => {
	await initializeUserModel();
	return User;
})();

export default UserModelPromise;
