import { DataTypes, Model, Sequelize } from 'sequelize';
import initializeDatabase from '../index.js';

class UserSession extends Model {}

async function initializeUserSessionModel() {
	const sequelize = await initializeDatabase();

	UserSession.init(
		{
			sessionId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				unique: true
			},
			userId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true
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
				types: DataTypes.DATE,
				defaultValue: Sequelize.NOW
			},
			updatedAt: {
				types: DataTypes.DATE,
				defaultValue: null
			},
			expiresAt: {
				type: DataTypes.DATE,
				allowNull: false
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true
			}
		},
		{
			sequelize,
			modelName: 'UserSession',
			timestamps: true,
			hooks: {
				beforeCreate: (session) => {
					session.expiresAt = new Date(
						session.createdAt.getTime() + 60 * 60000
					); // default expiration time is 60 minutes after session generation
				},
				beforeUpdate: (session) => {
					session.updatedAt = new Date(); // Update the updatedAt field on every update
				}
			}
		}
	);
}

const UserSessionModelPromise = (async () => {
	await initializeUserSessionModel();
	return UserSession;
})();

export default UserSessionModelPromise;
