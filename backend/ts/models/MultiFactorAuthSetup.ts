import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface MultiFactorAuthSetupAttributes {
	mfaId: string;
	userId: string;
	method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
	secret?: string | null;
	publicKey?: string | null;
	counter?: number | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

class MultiFactorAuthSetup extends Model<InferAttributes<MultiFactorAuthSetup>, InferCreationAttributes<MultiFactorAuthSetup>> implements MultiFactorAuthSetupAttributes {
	mfaId!: string;
	userId!: string;
	method!: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
	secret!: string | null;
	publicKey!: string | null;
	counter!: number | null;
	isActive!: boolean;
	createdAt!: CreationOptional<Date>;
	updatedAt!: CreationOptional<Date>;
}

async function initializeMultiFactorAuthSetupModel(): Promise<typeof MultiFactorAuthSetup> {
	const sequelize = await initializeDatabase();

	MultiFactorAuthSetup.init(
		{
			mfaId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
			},
			method: {
				type: DataTypes.ENUM('totp', 'email', 'yubico', 'fido2', 'passkey'),
				allowNull: false,
			},
			secret: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			publicKey: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			counter: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'MultiFactorAuthSetup',
			timestamps: true,
		}
	);

	await MultiFactorAuthSetup.sync();
	return MultiFactorAuthSetup;
}

const MultiFactorAuthSetupModelPromise = initializeMultiFactorAuthSetupModel();
export default MultiFactorAuthSetupModelPromise;
