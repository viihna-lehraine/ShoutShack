import { Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
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
export default function createDeviceModel(sequelize: Sequelize): typeof Device;
export {};
//# sourceMappingURL=Device.d.ts.map