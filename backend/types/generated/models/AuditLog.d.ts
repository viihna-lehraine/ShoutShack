import { InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
interface AuditLogAttributes {
    auditId: string;
    id?: string | null;
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
export default function createAuditLogModel(sequelize: Sequelize, logger: Logger): typeof AuditLog;
export { AuditLog };
//# sourceMappingURL=AuditLog.d.ts.map