import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { AuditLogAttributes } from '../index/interfaces/models';
export declare class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> implements AuditLogAttributes {
    auditId: string;
    id?: string | null;
    actionType: string;
    actionDescription: string | null;
    affectedResource: string | null;
    previousValue: string | null;
    newValue: string | null;
    ipAddress: string;
    userAgent: string;
    auditLogDate: Date;
    auditLogUpdateDate?: Date | null;
}
export declare function createAuditLogModel(): Promise<typeof AuditLog | null>;
//# sourceMappingURL=AuditLog.d.ts.map