import { DataTypes, Model, Sequelize } from 'sequelize';
import initializeDatabase from '../config/db.js';

class FailedLoginAttempts extends Model {}

// Initialize the FailedLoginAttempt model
async function initializeFailedLoginAttemptsModel() {
	const sequelize = await initializeDatabase();

	FailedLoginAttempts.init(
		{
			attemptId: {
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
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			attemptedAt: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
				allowNull: false,
			},
			isLocked: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			sequelize,
			modelName: 'FailedLoginAttempt',
			timestamps: false,
		}
	);
}

const FailedLoginAttemptsModelPromise = (async () => {
	await initializeFailedLoginAttemptsModel();
	return FailedLoginAttempts;
})();

export default FailedLoginAttemptsModelPromise;
