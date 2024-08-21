import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
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
export default RecoveryMethod;
//# sourceMappingURL=RecoveryMethod.d.ts.map