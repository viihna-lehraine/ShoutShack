import { Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { FailedLoginAttemptsAttributes } from '../index/interfaces/models';
export declare class FailedLoginAttempts extends Model<InferAttributes<FailedLoginAttempts>, InferCreationAttributes<FailedLoginAttempts>> implements FailedLoginAttemptsAttributes {
    attemptId: string;
    id: string;
    ipAddress: string;
    userAgent: string;
    attemptDate: Date;
    isLocked: boolean;
}
export declare function createFailedLoginAttemptsModel(): Promise<typeof FailedLoginAttempts | null>;
//# sourceMappingURL=FailedLoginAttempts.d.ts.map