import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';
import { Logger } from '../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';

interface UserMfaAttributes {
	id: string; // UUID for the MFA record and primary key (from User model)
	isMfaEnabled: boolean;
	backupCodes: string[] | null;
	isEmail2faEnabled: boolean;
	isTotp2faEnabled: boolean;
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
	isTotp2faEnabled!: boolean;
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

export default function createUserMfaModel(
	sequelize: Sequelize,
	logger: Logger
): typeof UserMfa {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

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
					allowNull: true
				},
				isEmail2faEnabled: {
					type: DataTypes.BOOLEAN,
					defaultValue: false,
					allowNull: false
				},
				isTotp2faEnabled: {
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
					allowNull: true
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
				}
			},
			{
				sequelize,
				modelName: 'UserMfa',
				timestamps: true
			}
		);

		return UserMfa;
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw error;
	}
}
