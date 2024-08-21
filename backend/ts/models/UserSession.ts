import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';

interface UserSessionAttributes {
	id: string;
	sessionId: number;
	userId: string;
	ipAddress: string;
	userAgent: string;
	createdAt: Date;
	updatedAt?: Date | null;
	expiresAt: Date;
	isActive: boolean;
}

class UserSession
	extends Model<
		InferAttributes<UserSession>,
		InferCreationAttributes<UserSession>
	>
	implements UserSessionAttributes
{
	id!: string;
	sessionId!: number;
	userId!: string;
	ipAddress!: string;
	userAgent!: string;
	createdAt!: CreationOptional<Date>;
	updatedAt!: Date | null;
	expiresAt!: Date;
	isActive!: boolean;
}

export default UserSession;
