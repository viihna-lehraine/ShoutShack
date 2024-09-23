import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../services/appLogger';
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
	sequelize: Sequelize,
	logger: Logger
): typeof MultiFactorAuthSetup | null {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
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
		const databaseError = new errorClasses.DatabaseErrorRecoverable(
			`Failed to initialize MultiFactorAuthSetup model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(databaseError.message, logger);
		processError(databaseError, logger);
		return null;
	}
}

export { MultiFactorAuthSetup };