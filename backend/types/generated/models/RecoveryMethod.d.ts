import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
interface RecoveryMethodAttributes {
    id: string;
    isRecoveryActive: boolean;
    recoveryId: string;
    recoveryMethod?: 'email' | 'backupCodes' | null;
    backupCodes?: string[] | null;
    recoveryLastUpdated: Date;
}
declare class RecoveryMethod extends Model<InferAttributes<RecoveryMethod>, InferCreationAttributes<RecoveryMethod>> implements RecoveryMethodAttributes {
    id: string;
    isRecoveryActive: boolean;
    recoveryId: string;
    recoveryMethod?: 'email' | 'backupCodes' | null;
    backupCodes: string[] | null;
    recoveryLastUpdated: CreationOptional<Date>;
}
export default function createRecoveryMethodModel(sequelize: Sequelize, logger: Logger): typeof RecoveryMethod;
export { RecoveryMethod };
//# sourceMappingURL=RecoveryMethod.d.ts.map