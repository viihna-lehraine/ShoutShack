import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
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

export default Device;
