import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface UserMfaAttributes {
	id: string; // UUID for the MFA record, primary key (from User model)
	isMfaEnabled: boolean; // indicates if MFA is enabled for the user
	backupCodes: string[] | null; // backup codes for MFA, nullable
	isEmail2faEnabled: boolean; // indicates if email 2FA is enabled for the user
	isTotp2faEnabled: boolean; // indicates if TOTP 2FA is enabled for the user
	isYubicoOtp2faEnabled: boolean; // indicates if Yubico OTP 2FA is enabled for the user
	isU2f2faEnabled: boolean; // indicates if U2F 2FA is enabled for the user
	isPasskeyEnabled: boolean; // indicates if passkey 2FA is enabled for the user
	totpSecret: string | null; // secret key for TOTP, nullable
	yubicoOtpPublicId: string | null; // public ID for Yubico OTP, nullable
	yubicoOtpSecretKey: string | null; // secret key for Yubico OTP, nullable
	fido2CredentialId: string | null; // credential ID for FIDO2, nullable
	fido2PublicKey: string | null; // public key for FIDO2, nullable
	fido2Counter: number | null; // counter for FIDO2, nullable
	fido2AttestationFormat: string | null; // attestation format for FIDO2, nullable
	passkeyCredentialId: string | null; // credential ID for passkey, nullable
	passkeyPublicKey: string | null; // public key for passkey, nullable
	passkeyCounter: number | null; // counter for passkey, nullable
	passkeyAttestationFormat: string | null; // attestation format for passkey, nullable
}

class UserMfa
	extends Model<InferAttributes<UserMfa>, InferCreationAttributes<UserMfa>>
	implements UserMfaAttributes
{
	id!: string; // initialized as a non-nullable string (UUID)
	isMfaEnabled!: boolean; // initialized as a non-nullable boolean
	backupCodes!: string[] | null; // nullable, may contain an array of strings or null
	isEmail2faEnabled!: boolean; // initialized as a non-nullable boolean
	isTotp2faEnabled!: boolean; // initialized as a non-nullable boolean
	isYubicoOtp2faEnabled!: boolean; // initialized as a non-nullable boolean
	isU2f2faEnabled!: boolean; // initialized as a non-nullable boolean
	isPasskeyEnabled!: boolean; // initialized as a non-nullable boolean
	totpSecret!: string | null; // nullable, may contain string or null
	yubicoOtpPublicId!: string | null; // nullable, may contain string or null
	yubicoOtpSecretKey!: string | null; // nullable, may contain string or null
	fido2CredentialId!: string | null; // nullable, may contain string or null
	fido2PublicKey!: string | null; // nullable, may contain string or null
	fido2Counter!: number | null; // nullable, may contain number or null
	fido2AttestationFormat!: string | null; // nullable, may contain string or null
	passkeyCredentialId!: string | null; // nullable, may contain string or null
	passkeyPublicKey!: string | null; // nullable, may contain string or null
	passkeyCounter!: number | null; // nullable, may contain number or null
	passkeyAttestationFormat!: string | null; // nullable, may contain string or null
}

export type UserMfaInstance = InstanceType<typeof UserMfa>;

export default function createUserMfaModel(
	sequelize: Sequelize
): typeof UserMfa {
	UserMfa.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4, // default to a generated UUID from the User model
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			isMfaEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false // MFA is disabled by default
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				defaultValue: undefined,
				allowNull: true // backup codes are optional
			},
			isEmail2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false // email 2FA is disabled by default and its status is required
			},
			isTotp2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false // TOTP 2FA is disabled by default and its status is required
			},
			isYubicoOtp2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false // Yubico OTP 2FA is disabled by default and its status is required
			},
			isU2f2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false // U2F 2FA is disabled by default and its status is required
			},
			isPasskeyEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false // passkey 2FA is disabled by default and its status is required
			},
			totpSecret: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true, // secret key is optional
				unique: true
			},
			yubicoOtpPublicId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true, // public ID is optional
				unique: true
			},
			yubicoOtpSecretKey: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true, // Yubico OTP secret key is optional
				unique: true
			},
			fido2CredentialId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true, // FIDO2 credential ID is optional
				unique: true
			},
			fido2PublicKey: {
				type: DataTypes.TEXT,
				defaultValue: undefined,
				allowNull: true // FIDO2 public key is optional
			},
			fido2Counter: {
				type: DataTypes.INTEGER,
				defaultValue: undefined,
				allowNull: true // FIDO2 counter is optional
			},
			fido2AttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true // FIDO2 attestation format is optional
			},
			passkeyCredentialId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true, // passkey credential ID is optional
				unique: true
			},
			passkeyPublicKey: {
				type: DataTypes.TEXT,
				defaultValue: undefined,
				allowNull: true, // passkey public key is optional
				unique: true
			},
			passkeyCounter: {
				type: DataTypes.INTEGER,
				defaultValue: undefined,
				allowNull: true // passkey counter is optional
			},
			passkeyAttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true // passkey attestation format is optional
			}
		},
		{
			sequelize,
			modelName: 'UserMfa',
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	return UserMfa;
}
