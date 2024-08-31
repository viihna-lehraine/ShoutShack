import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	Sequelize
} from 'sequelize';

interface DeviceAttributes {
	deviceId: number;
	id: string;
	deviceName: string;
	deviceType: string;
	os: string;
	browser?: string | null;
	ipAddress: string;
	lastUsed: Date;
	isTrusted: boolean;
	creationDate: Date;
	lastUpdated: Date;
}

class Device
	extends Model<InferAttributes<Device>, InferCreationAttributes<Device>>
	implements DeviceAttributes
{
	deviceId!: number;
	id!: string;
	deviceName!: string;
	deviceType!: string;
	os!: string;
	browser!: string | null;
	ipAddress!: string;
	lastUsed!: CreationOptional<Date>;
	isTrusted!: boolean;
	creationDate!: CreationOptional<Date>;
	lastUpdated!: CreationOptional<Date>;
}

export default function createDeviceModel(sequelize: Sequelize): typeof Device {
	Device.init(
		{
			deviceId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: true
			},
			id: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			deviceName: {
				type: DataTypes.STRING,
				allowNull: false
			},
			deviceType: {
				type: DataTypes.STRING,
				allowNull: false
			},
			os: {
				type: DataTypes.STRING,
				allowNull: false
			},
			browser: {
				type: DataTypes.STRING,
				allowNull: true
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			lastUsed: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: DataTypes.NOW
			},
			isTrusted: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			creationDate: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: DataTypes.NOW
			},
			lastUpdated: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: DataTypes.NOW
			}
		},
		{
			sequelize,
			tableName: 'Devices',
			timestamps: false
		}
	);

	return Device;
}
