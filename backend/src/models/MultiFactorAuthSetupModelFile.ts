import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';

interface MultiFactorAuthSetupAttributes {
	mfaId: number; // primary key for MFA setup record, auto-incremented
	id: string; // UUID for MFA setup, primary key (from User model)
	method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
	secret?: string | null;
	publicKey?: string | null;
	counter?: number | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

class MultiFactorAuthSetup
	extends Model<
		InferAttributes<MultiFactorAuthSetup>,
		InferCreationAttributes<MultiFactorAuthSetup>
	>
	implements MultiFactorAuthSetupAttributes
{
	public mfaId!: number;
	public id!: string;
	public method!: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
	public secret?: string | null;
	public publicKey!: string | null;
	public counter!: number | null;
	public isActive!: boolean;
	public createdAt!: CreationOptional<Date>;
	public updatedAt!: CreationOptional<Date>;
}

export default function createMultiFactorAuthSetupModel(
	sequelize: Sequelize
): typeof MultiFactorAuthSetup | null {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

		MultiFactorAuthSetup.init(
			{
				mfaId: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					allowNull: false,
					primaryKey: true,
					unique: true,
					references: {
						model: User,
						key: 'id'
					}
				},
				method: {
					type: DataTypes.ENUM(
						'totp',
						'email',
						'yubico',
						'fido2',
						'passkey'
					),
					allowNull: false
				},
				secret: {
					type: DataTypes.STRING,
					allowNull: true
				},
				publicKey: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				counter: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				isActive: {
					type: DataTypes.BOOLEAN,
					defaultValue: false,
					allowNull: false
				},
				createdAt: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				updatedAt: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'MultiFactorAuthSetup',
				timestamps: true
			}
		);

		return MultiFactorAuthSetup;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize MultiFactorAuthSetup model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logInfo(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}

export { MultiFactorAuthSetup };
