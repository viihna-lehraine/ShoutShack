import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';

interface FailedLoginAttemptsAttributes {
	attemptId: string;
	id: string;
	ipAddress: string;
	userAgent: string;
	attemptDate: Date;
	isLocked: boolean;
}

class FailedLoginAttempts
	extends Model<
		InferAttributes<FailedLoginAttempts>,
		InferCreationAttributes<FailedLoginAttempts>
	>
	implements FailedLoginAttemptsAttributes
{
	attemptId!: string;
	id!: string;
	ipAddress!: string;
	userAgent!: string;
	attemptDate!: Date;
	isLocked!: boolean;
}

export default FailedLoginAttempts;
