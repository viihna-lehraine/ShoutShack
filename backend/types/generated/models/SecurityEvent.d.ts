import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { SecurityEventAttributes } from '../index/interfaces/models';
declare class SecurityEvent extends Model<InferAttributes<SecurityEvent>, InferCreationAttributes<SecurityEvent>> implements SecurityEventAttributes {
    id: string;
    eventId: string;
    eventType: string;
    eventDescription: string | null;
    ipAddress: string;
    userAgent: string;
    securityEventDate: Date;
    securityEventLastUpdated: CreationOptional<Date>;
}
export declare function createSecurityEventModel(): Promise<typeof SecurityEvent | null>;
export {};
//# sourceMappingURL=SecurityEvent.d.ts.map