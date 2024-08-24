import { Model, InferAttributes, InferCreationAttributes } from 'sequelize';
interface RecoveryMethodAttributes {
	id: string;
	isRecoveryActive: boolean;
	recoveryId: string;
	recoveryMethod: 'email' | 'backupCodes';
	backupCodes?: string[] | null;
	recoveryLastUpdated: Date;
}
declare class RecoveryMethod
	extends Model<
		InferAttributes<RecoveryMethod>,
		InferCreationAttributes<RecoveryMethod>
	>
	implements RecoveryMethodAttributes
{
	id: string;
	isRecoveryActive: boolean;
	recoveryId: string;
	recoveryMethod: 'email' | 'backupCodes';
	backupCodes: string[] | null;
	recoveryLastUpdated: Date;
}
declare const RecoveryMethodModelPromise: Promise<typeof RecoveryMethod>;
export default RecoveryMethodModelPromise;
//# sourceMappingURL=RecoveryMethod.d.ts.map
