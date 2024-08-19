import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface DeviceAttributes {
	deviceId: string;
	userId: string;
	deviceName: string;
	deviceType: string;
	os: string;
	browser?: string | null;
	ipAddress: string;
	lastUsedAt: Date;
	isTrusted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

class Device extends Model<InferAttributes<Device>, InferCreationAttributes<Device>> implements DeviceAttributes {
	deviceId!: string;
	userId!: string;
	deviceName!: string;
	deviceType!: string;
	os!: string;
	browser!: string | null;
	ipAddress!: string;
	lastUsedAt!: CreationOptional<Date>;
	isTrusted!: boolean;
	createdAt!: CreationOptional<Date>;
	updatedAt!: CreationOptional<Date>;
}

// Initialize the Device model
async function initializeDeviceModel(): Promise<typeof Device> {
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
				defaultValue: DataTypes.NOW,
			},
			isTrusted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
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
			modelName: 'Device',
			timestamps: true,
		}
	);

	await Device.sync();
	return Device;
}

// Export the initialized model
const DeviceModelPromise = initializeDeviceModel();
export default DeviceModelPromise;
