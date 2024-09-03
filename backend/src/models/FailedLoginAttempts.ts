import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface FailedLoginAttemptsAttributes {
	attemptId: string; // primary key for the failed login attempt record
	id: string; // foreign key referencing the User model
	ipAddress: string; // IP address from where the attempt was made
	userAgent: string; // user agent string for the device used
	attemptDate: Date; // date and time of the failed login attempt
	isLocked: boolean; // indicates if the account is locked due to this attempt
}

class FailedLoginAttempts
	extends Model<
		InferAttributes<FailedLoginAttempts>,
		InferCreationAttributes<FailedLoginAttempts>
	>
	implements FailedLoginAttemptsAttributes
{
	attemptId!: string; // initialized as a non-nullable string (UUID)
	id!: string; // initialized as a non-nullable string (UUID)
	ipAddress!: string; // initialized as a non-nullable string
	userAgent!: string; // initialized as a non-nullable string
	attemptDate!: Date; // initialized as a non-nullable date
	isLocked!: boolean; // initialized as a non-nullable boolean
}

export default function createFailedLoginAttemptsModel(
	sequelize: Sequelize
): typeof FailedLoginAttempts {
	FailedLoginAttempts.init(
		{
			attemptId: {
				type: DataTypes.INTEGER,
				primaryKey: true, // primary key for the failed login attempt record
				autoIncrement: true, // auto-increment for unique attempts
				allowNull: false,
				unique: true
			},
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4, // default to a generated UUID
				allowNull: false, // non-nullable as it references the User model
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false // IP address is required
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false // user agent is required
			},
			attemptDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
				allowNull: false // date and time of the attempt
			},
			isLocked: {
				type: DataTypes.BOOLEAN,
				defaultValue: false // account is not locked by default
			}
		},
		{
			sequelize,
			modelName: 'FailedLoginAttempts',
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	return FailedLoginAttempts;
}
