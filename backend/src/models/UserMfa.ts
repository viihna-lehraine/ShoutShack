import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface UserMfaAttributes {
	id: string;
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

class UserMfa
	extends Model<InferAttributes<UserMfa>, InferCreationAttributes<UserMfa>>
	implements UserMfaAttributes
{
	id!: string;
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

export type UserMfaInstance = InstanceType<typeof UserMfa>;

export default function createUserMfaModel(
	sequelize: Sequelize
): typeof UserMfa {
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
			isMfaEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				defaultValue: undefined,
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
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			yubicoOtpPublicId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			yubicoOtpSecretKey: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			fido2CredentialId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			fido2PublicKey: {
				type: DataTypes.TEXT,
				defaultValue: undefined,
				allowNull: true
			},
			fido2Counter: {
				type: DataTypes.INTEGER,
				defaultValue: undefined,
				allowNull: true
			},
			fido2AttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true
			},
			passkeyCredentialId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			passkeyPublicKey: {
				type: DataTypes.TEXT,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			passkeyCounter: {
				type: DataTypes.INTEGER,
				defaultValue: undefined,
				allowNull: true
			},
			passkeyAttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true
			}
		},
		{
			sequelize,
			modelName: 'UserMfa',
			timestamps: true
		}
	);

	return UserMfa;
}
