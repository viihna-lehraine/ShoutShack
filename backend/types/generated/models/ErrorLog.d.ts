import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { ErrorLogAttributes } from '../index/interfaces/models';
export declare class ErrorLog extends Model<InferAttributes<ErrorLog>, InferCreationAttributes<ErrorLog>> implements ErrorLogAttributes {
    id: CreationOptional<number>;
    name: string;
    message: string;
    statusCode: number | null;
    severity: string;
    errorCode: string | null;
    details: string | Record<string, unknown> | null;
    timestamp: CreationOptional<Date>;
    count: number;
}
export declare function createErrorLogModel(): Promise<typeof ErrorLog | null>;
//# sourceMappingURL=ErrorLog.d.ts.map