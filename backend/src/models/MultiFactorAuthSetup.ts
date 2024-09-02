import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface MultiFactorAuthSetupAttributes {
	mfaId: number;
	id: string;
	userId: string;
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
	mfaId!: number;
	id!: string;
	userId!: string;
	method!: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
	secret!: string | null;
	publicKey!: string | null;
	counter!: number | null;
	isActive!: boolean;
	createdAt!: CreationOptional<Date>;
	updatedAt!: CreationOptional<Date>;
}

export default function createMultiFactorAuthSetupModel(
	sequelize: Sequelize
): typeof MultiFactorAuthSetup {
	MultiFactorAuthSetup.init(
		{
			mfaId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				unique: true
			},
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false
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
				defaultValue: true,
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
}
