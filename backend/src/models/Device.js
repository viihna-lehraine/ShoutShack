import { DataTypes, Model, Sequelize } from 'sequelize';
import initializeDatabase from '../config/db.js';

class Device extends Model {}

// Initialize the Device model
async function initializeDeviceModel() {
	const sequelize = await initializeDatabase();

	Device.init(
		{
			deviceId: {
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
			deviceName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			deviceType: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					isIn: [['desktop', 'laptop', 'tablet', 'mobile', 'other']],
				},
			},
			os: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			browser: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			lastUsedAt: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
			},
			isTrusted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
			},
		},
		{
			sequelize,
			modelName: 'Device',
			timestamps: true,
		}
	);
}

const DeviceModelPromise = (async () => {
	await initializeDeviceModel();
	return Device;
})();

export default DeviceModelPromise;
