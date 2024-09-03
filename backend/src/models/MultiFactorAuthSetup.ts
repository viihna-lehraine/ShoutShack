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
	mfaId: number; // primary key for the multi-factor authentication setup record
	id: string; // UUID for multi-factor authentication setup, primary key (from User model)
	userId: string; // UUID for user, foreign key (from User model)
	method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey'; // type of multi-factor authentication method
	secret?: string | null; // secret key for TOTP, nullable
	publicKey?: string | null; // public key for FIDO2, nullable
	counter?: number | null; // counter for Yubico, nullable
	isActive: boolean; // indicates if the multi-factor authentication method is active
	createdAt: Date; // date when the multi-factor authentication method was created
	updatedAt: Date; // date when the multi-factor authentication method was last updated
}

class MultiFactorAuthSetup
	extends Model<
		InferAttributes<MultiFactorAuthSetup>,
		InferCreationAttributes<MultiFactorAuthSetup>
	>
	implements MultiFactorAuthSetupAttributes
{
	mfaId!: number; // initialized as a non-nullable integer
	id!: string; // initialized as a non-nullable string (UUID)
	userId!: string; // initialized as a non-nullable string (UUID)
	method!: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey'; // initialized as a non-nullable string with five possible values
	secret!: string | null; // nullable, may contain string or null
	publicKey!: string | null; // nullable, may contain string or null
	counter!: number | null; // nullable, may contain number or null
	isActive!: boolean; // initialized as a non-nullable boolean
	createdAt!: CreationOptional<Date>; // optional field, defaults to current date
	updatedAt!: CreationOptional<Date>; // optional field, defaults to current date
}

export default function createMultiFactorAuthSetupModel(
	sequelize: Sequelize
): typeof MultiFactorAuthSetup {
	MultiFactorAuthSetup.init(
		{
			mfaId: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				allowNull: false, // auto-incremented primary key
				unique: true
			},
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4, // default to a generated UUID from the User model
				allowNull: false,
				primaryKey: true,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false, // foreign key from the User model
				references: {
					model: User,
					key: 'userId'
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
				allowNull: false // multi-factor authentication method is required
			},
			secret: {
				type: DataTypes.STRING,
				allowNull: true // secret key is optional
			},
			publicKey: {
				type: DataTypes.TEXT,
				allowNull: true // public key is optional
			},
			counter: {
				type: DataTypes.INTEGER,
				allowNull: true // counter is optional
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: false, // multi-factor authentication is disabled by default
				allowNull: false
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
				allowNull: false
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
				allowNull: false
			}
		},
		{
			sequelize,
			modelName: 'MultiFactorAuthSetup',
			timestamps: true // automatically manage createdAt and updatedAt timestamps
		}
	);

	return MultiFactorAuthSetup;
}
