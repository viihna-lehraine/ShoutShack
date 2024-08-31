import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';

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
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			isMfaEnabled: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			isEmail2faEnabled: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			isTotpl2faEnabled: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			isYubicoOtp2faEnabled: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			isU2f2faEnabled: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			isPasskeyEnabled: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			totpSecret: {
				type: DataTypes.STRING,
				allowNull: true
			},
			yubicoOtpPublicId: {
				type: DataTypes.STRING,
				allowNull: true
			},
			yubicoOtpSecretKey: {
				type: DataTypes.STRING,
				allowNull: true
			},
			fido2CredentialId: {
				type: DataTypes.STRING,
				allowNull: true
			},
			fido2PublicKey: {
				type: DataTypes.STRING,
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
				allowNull: true
			},
			passkeyPublicKey: {
				type: DataTypes.STRING,
				allowNull: true
			},
			passkeyCounter: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			passkeyAttestationFormat: {
				type: DataTypes.STRING,
				allowNull: true
			}
		},
		{
			sequelize,
			tableName: 'UserMfa',
			timestamps: false
		}
	);

	return UserMfa;
}
