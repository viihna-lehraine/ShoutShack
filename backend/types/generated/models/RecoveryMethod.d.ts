import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
interface RecoveryMethodAttributes {
    id: string;
    isRecoveryActive: boolean;
    recoveryId: string;
    recoveryMethod: 'email' | 'backupCodes';
    backupCodes?: string[] | null;
    recoveryLastUpdated: Date;
}
declare class RecoveryMethod extends Model<InferAttributes<RecoveryMethod>, InferCreationAttributes<RecoveryMethod>> implements RecoveryMethodAttributes {
    id: string;
    isRecoveryActive: boolean;
    recoveryId: string;
    recoveryMethod: 'email' | 'backupCodes';
    backupCodes: string[] | null;
    recoveryLastUpdated: CreationOptional<Date>;
}
export default function createRecoveryMethodModel(sequelize: Sequelize): typeof RecoveryMethod;
export {};
//# sourceMappingURL=RecoveryMethod.d.ts.map