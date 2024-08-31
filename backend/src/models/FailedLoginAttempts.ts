import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	DataTypes,
	Sequelize
} from 'sequelize';

interface FailedLoginAttemptsAttributes {
	attemptId: string;
	id: string;
	ipAddress: string;
	userAgent: string;
	attemptDate: Date;
	isLocked: boolean;
}

class FailedLoginAttempts
	extends Model<
		InferAttributes<FailedLoginAttempts>,
		InferCreationAttributes<FailedLoginAttempts>
	>
	implements FailedLoginAttemptsAttributes
{
	attemptId!: string;
	id!: string;
	ipAddress!: string;
	userAgent!: string;
	attemptDate!: Date;
	isLocked!: boolean;
}

export default function createFailedLoginAttemptsModel(
	sequelize: Sequelize
): typeof FailedLoginAttempts {
	FailedLoginAttempts.init(
		{
			attemptId: {
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			id: {
				type: DataTypes.STRING,
				allowNull: false
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			attemptDate: {
				type: DataTypes.DATE,
				allowNull: false
			},
			isLocked: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			}
		},
		{
			sequelize,
			tableName: 'FailedLoginAttempts',
			timestamps: false
		}
	);

	return FailedLoginAttempts;
}
