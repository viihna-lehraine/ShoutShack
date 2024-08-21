import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

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

// Get the Sequelize instance
const sequelize = getSequelizeInstance();

// Initialize the MultiFactorAuthSetup model
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
			type: DataTypes.ENUM('totp', 'email', 'yubico', 'fido2', 'passkey'),
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

export default MultiFactorAuthSetup;
