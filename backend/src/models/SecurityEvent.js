import { DataTypes, Model, Sequelize } from 'sequelize';
import initializeDatabase from '../index.js';

class SecurityEvent extends Model {}

// Initialize the SecurityEvent model
async function initializeSecurityEventModel() {
	const sequelize = await initializeDatabase();

	SecurityEvent.init(
		{
			eventId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false
			},
			eventType: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					isIn: [
						[
							'login',
							'failed-login',
							'password-change',
							'2fa-enabled',
							'2fa-disabled',
							'account-lock',
							'other'
						]
					]
				}
			},
			eventDescription: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW
			}
		},
		{
			sequelize,
			modelName: 'SecurityEvent',
			timestamps: true
		}
	);
}

const SecurityEventModelPromise = (async () => {
	await initializeSecurityEventModel();
	return SecurityEvent;
})();

export default SecurityEventModelPromise;
