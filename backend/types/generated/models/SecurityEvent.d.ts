import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
interface SecurityEventAttributes {
    id: string;
    eventId: string;
    eventType: string;
    eventDescription?: string | null;
    ipAddress: string;
    userAgent: string;
    securityEventDate: Date;
    securityEventLastUpdated: Date;
}
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
export default function createSecurityEventModel(sequelize: Sequelize): typeof SecurityEvent;
export {};
//# sourceMappingURL=SecurityEvent.d.ts.map