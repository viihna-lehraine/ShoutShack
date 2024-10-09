import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { DeviceAttributes } from '../index/interfaces/models';
export declare class Device extends Model<InferAttributes<Device>, InferCreationAttributes<Device>> implements DeviceAttributes {
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
export declare function createDeviceModel(): Promise<typeof Device | null>;
//# sourceMappingURL=Device.d.ts.map