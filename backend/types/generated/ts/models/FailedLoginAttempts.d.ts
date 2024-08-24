import { Model, InferAttributes, InferCreationAttributes } from 'sequelize';
interface FailedLoginAttemptsAttributes {
	id: string;
	attemptId: string;
	ipAddress: string;
	userAgent: string;
	attemptDate: Date;
	isLocked: boolean;
}
declare class FailedLoginAttempts
	extends Model<
		InferAttributes<FailedLoginAttempts>,
		InferCreationAttributes<FailedLoginAttempts>
	>
	implements FailedLoginAttemptsAttributes
{
	id: string;
	attemptId: string;
	ipAddress: string;
	userAgent: string;
	attemptDate: Date;
	isLocked: boolean;
}
declare const FailedLoginAttemptsModelPromise: Promise<
	typeof FailedLoginAttempts
>;
export default FailedLoginAttemptsModelPromise;
//# sourceMappingURL=FailedLoginAttempts.d.ts.map
