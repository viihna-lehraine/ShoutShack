import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';

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
				autoIncrement: true,
				primaryKey: true
			},
			id: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userId: {
				type: DataTypes.STRING,
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
				type: DataTypes.STRING,
				allowNull: true
			},
			counter: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			}
		},
		{
			sequelize,
			tableName: 'MultiFactorAuthSetups',
			timestamps: true
		}
	);

	return MultiFactorAuthSetup;
}
