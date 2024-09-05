import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
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
declare class Device extends Model<InferAttributes<Device>, InferCreationAttributes<Device>> implements DeviceAttributes {
    deviceId: number;
    id: string;
    deviceName: string;
    deviceType: string;
    os: string;
    browser: string | null;
    ipAddress: string;
    lastUsed: CreationOptional<Date>;
    isTrusted: boolean;
    creationDate: CreationOptional<Date>;
    lastUpdated: CreationOptional<Date>;
}
export default function createDeviceModel(sequelize: Sequelize, logger: Logger): typeof Device;
export { Device };
//# sourceMappingURL=Device.d.ts.map