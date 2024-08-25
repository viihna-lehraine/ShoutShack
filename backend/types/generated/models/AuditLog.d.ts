import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
interface AuditLogAttributes {
    auditId: string;
    id: string;
    actionType: string;
    actionDescription?: string | null;
    affectedResource?: string | null;
    previousValue?: string | null;
    newValue?: string | null;
    ipAddress: string;
    userAgent: string;
    auditLogDate: Date;
    auditLogUpdateDate?: Date | null;
}
declare class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> implements AuditLogAttributes {
    auditId: string;
    id: string;
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
export default AuditLog;
//# sourceMappingURL=AuditLog.d.ts.map