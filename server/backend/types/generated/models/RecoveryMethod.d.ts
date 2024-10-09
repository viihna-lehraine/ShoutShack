import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { RecoveryMethodAttributes } from '../index/interfaces/models';
export declare class RecoveryMethod extends Model<InferAttributes<RecoveryMethod>, InferCreationAttributes<RecoveryMethod>> implements RecoveryMethodAttributes {
    id: string;
    isRecoveryActive: boolean;
    recoveryId: string;
    recoveryMethod?: 'email' | 'backupCodes' | null;
    backupCodes: string[] | null;
    recoveryLastUpdated: CreationOptional<Date>;
}
export declare function createRecoveryMethodModel(): Promise<typeof RecoveryMethod | null>;
//# sourceMappingURL=RecoveryMethod.d.ts.map