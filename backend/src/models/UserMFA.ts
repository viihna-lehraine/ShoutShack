import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes
} from 'sequelize';
import { User } from './User';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory/ServiceFactory';
import { UserMFAAttributes } from '../index/interfaces/models';

export class UserMFA
	extends Model<InferAttributes<UserMFA>, InferCreationAttributes<UserMFA>>
	implements UserMFAAttributes
{
	public id!: string;
	public isMfaEnabled!: boolean;
	public backupCodes!: string[] | null;
	public isEmail2faEnabled!: boolean;
	public isTotp2faEnabled!: boolean;
	public isYubicoOtp2faEnabled!: boolean;
	public isU2f2faEnabled!: boolean;
	public isPasskeyEnabled!: boolean;
	public totpSecret!: string | null;
	public yubicoOtpPublicId!: string | null;
	public yubicoOtpSecretKey!: string | null;
	public fido2CredentialId!: string | null;
	public fido2PublicKey!: string | null;
	public fido2Counter!: number | null;
	public fido2AttestationFormat!: string | null;
	public passkeyCredentialId!: string | null;
	public passkeyPublicKey!: string | null;
	public passkeyCounter!: number | null;
	public passkeyAttestationFormat!: string | null;
}

export async function createUserMFAModel(): Promise<typeof UserMFA | null> {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();

	try {
		const databaseController = await ServiceFactory.getDatabaseController();
		const sequelize = databaseController.getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize UserMFA model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}

		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

		UserMFA.init(
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

		return UserMFA;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize UserMfa model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}
