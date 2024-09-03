import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface DeviceAttributes {
	deviceId: number; // primary key, auto-incremented
	id: string; // foreign key to the User model
	deviceName: string; // name of the device
	deviceType: string; // type of the device (e.g., desktop, laptop, etc.)
	os: string; // pperating system of the device
	browser?: string | null; // optional browser information
	ipAddress: string; // IP address associated with the device
	lastUsed: Date; // date when the device was last used
	isTrusted: boolean; // whether the device is trusted
	creationDate: Date; // date of creation of the record
	lastUpdated: Date; // date when the record was last updated
}

class Device
	extends Model<InferAttributes<Device>, InferCreationAttributes<Device>>
	implements DeviceAttributes
{
	deviceId!: number; // initialized as a non-nullable integer
	id!: string; // initialized as a non-nullable string (UUID)
	deviceName!: string; // initialized as a non-nullable string
	deviceType!: string; // initialized as a non-nullable string
	os!: string; // initialized as a non-nullable string
	browser!: string | null; // nullable, may contain string or null
	ipAddress!: string; // initialized as a non-nullable string
	lastUsed!: CreationOptional<Date>; // optional field, defaults to current date
	isTrusted!: boolean; // initialized as a non-nullable boolean
	creationDate!: CreationOptional<Date>; // optional field, defaults to current date
	lastUpdated!: CreationOptional<Date>; // optional field, defaults to current date
}

export default function createDeviceModel(sequelize: Sequelize): typeof Device {
	Device.init(
		{
			deviceId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true, // auto-increment for unique devices
				allowNull: false,
				unique: true
			},
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4, // default to a generated UUID
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			deviceName: {
				type: DataTypes.STRING,
				allowNull: true // device name is optional
			},
			deviceType: {
				type: DataTypes.STRING,
				allowNull: true, // device type is optional
				validate: {
					isIn: [['desktop', 'laptop', 'tablet', 'mobile', 'other']]
				}
			},
			os: {
				type: DataTypes.STRING,
				allowNull: true // operating system is optional
			},
			browser: {
				type: DataTypes.STRING,
				allowNull: true // browser information is optional
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false, // IP address is required
				validate: {
					isIP: true // validate IP address format
				}
			},
			lastUsed: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
				allowNull: true // last used date is optional
			},
			isTrusted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			creationDate: {
				type: DataTypes.DATE, // creation date of the record, default set to current date/time
				defaultValue: DataTypes.NOW,
				allowNull: false // creation date is required
			},
			lastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
				allowNull: true // last updated date is optional
			}
		},
		{
			sequelize,
			modelName: 'Device',
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	return Device;
}
