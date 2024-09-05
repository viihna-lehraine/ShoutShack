import { Model, InferAttributes, InferCreationAttributes, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
interface FailedLoginAttemptsAttributes {
    attemptId: string;
    id: string;
    ipAddress: string;
    userAgent: string;
    attemptDate: Date;
    isLocked: boolean;
}
declare class FailedLoginAttempts extends Model<InferAttributes<FailedLoginAttempts>, InferCreationAttributes<FailedLoginAttempts>> implements FailedLoginAttemptsAttributes {
    attemptId: string;
    id: string;
    ipAddress: string;
    userAgent: string;
    attemptDate: Date;
    isLocked: boolean;
}
export default function createFailedLoginAttemptsModel(sequelize: Sequelize, logger: Logger): typeof FailedLoginAttempts;
export { FailedLoginAttempts };
//# sourceMappingURL=FailedLoginAttempts.d.ts.map