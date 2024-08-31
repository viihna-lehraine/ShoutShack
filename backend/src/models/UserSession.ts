import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
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

export default function createUserSessionModel(
	sequelize: Sequelize
): typeof UserSession {
	UserSession.init(
		{
			id: {
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			sessionId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				autoIncrement: true
			},
			userId: {
				type: DataTypes.STRING,
				allowNull: false
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			createdAt: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: true
			},
			expiresAt: {
				type: DataTypes.DATE,
				allowNull: false
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			}
		},
		{
			sequelize,
			tableName: 'UserSessions',
			timestamps: true,
			updatedAt: 'updatedAt'
		}
	);

	return UserSession;
}
