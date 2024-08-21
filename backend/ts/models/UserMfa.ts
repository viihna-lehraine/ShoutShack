import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

interface UserMfaAttributes {
	id: string;
	userid: string;
	isMfaEnabled: boolean;
	backupCodes: string[] | null;
	isEmail2faEnabled: boolean;
	isTotpl2faEnabled: boolean;
	isYubicoOtp2faEnabled: boolean;
	isU2f2faEnabled: boolean;
	isPasskeyEnabled: boolean;
	totpSecret: string | null;
	yubicoOtpPublicId: string | null;
	yubicoOtpSecretKey: string | null;
	fido2CredentialId: string | null;
	fido2PublicKey: string | null;
	fido2Counter: number | null;
	fido2AttestationFormat: string | null;
	passkeyCredentialId: string | null;
	passkeyPublicKey: string | null;
	passkeyCounter: number | null;
	passkeyAttestationFormat: string | null;
}

// Fields in the UserMfa Model
class UserMfa
	extends Model<InferAttributes<UserMfa>, InferCreationAttributes<UserMfa>>
	implements UserMfaAttributes
{
	id!: string;
	userid!: string;
	isMfaEnabled!: boolean;
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
}

// Initialize the UserMfa model
UserMfa.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
			allowNull: false,
			unique: true,
			references: {
				model: User,
				key: 'id'
			}
		},
		userid: {
			type: DataTypes.UUID,
			allowNull: false,
			unique: true,
			references: {
				model: User,
				key: 'userid'
			}
		},
		isMfaEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
			references: {
				model: User,
				key: 'isMfaEnabled'
			}
		},
		backupCodes: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			defaultValue: null,
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
			defaultValue: null,
			allowNull: true,
			unique: true
		},
		yubicoOtpPublicId: {
			type: DataTypes.STRING,
			defaultValue: null,
			allowNull: true,
			unique: true
		},
		yubicoOtpSecretKey: {
			type: DataTypes.STRING,
			defaultValue: null,
			allowNull: true,
			unique: true
		},
		fido2CredentialId: {
			type: DataTypes.STRING,
			defaultValue: null,
			allowNull: true,
			unique: true
		},
		fido2PublicKey: {
			type: DataTypes.TEXT,
			defaultValue: null,
			allowNull: true
		},
		fido2Counter: {
			type: DataTypes.INTEGER,
			defaultValue: null,
			allowNull: true
		},
		fido2AttestationFormat: {
			type: DataTypes.STRING,
			defaultValue: null,
			allowNull: true
		},
		passkeyCredentialId: {
			type: DataTypes.STRING,
			defaultValue: null,
			allowNull: true,
			unique: true
		},
		passkeyPublicKey: {
			type: DataTypes.TEXT,
			defaultValue: null,
			allowNull: true,
			unique: true
		},
		passkeyCounter: {
			type: DataTypes.INTEGER,
			defaultValue: null,
			allowNull: true
		},
		passkeyAttestationFormat: {
			type: DataTypes.STRING,
			defaultValue: null,
			allowNull: true
		}
	},
	{
		sequelize: getSequelizeInstance(),
		modelName: 'UserMfa',
		timestamps: true
	}
);

export default UserMfa;
