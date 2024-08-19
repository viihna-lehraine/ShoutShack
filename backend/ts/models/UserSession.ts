import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';

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

class UserSession extends Model<InferAttributes<UserSession>, InferCreationAttributes<UserSession>> implements UserSessionAttributes {
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

async function initializeUserSessionModel(): Promise<typeof UserSession> {
	const sequelize = await initializeDatabase();

	UserSession.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: await UserModelPromise,
					key: 'id',
				}
			},
			sessionId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				unique: true,
			},
			userId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				allowNull: false,
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: null,
			},
			expiresAt: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
			},
		},
		{
			sequelize,
			modelName: 'UserSession',
			timestamps: true,
			hooks: {
				beforeCreate: (session) => {
					session.expiresAt = new Date(
						(session.createdAt as Date).getTime() + 60 * 60000
					); // default expiration time is 60 minutes after session generation
				},
				beforeUpdate: (session) => {
					session.updatedAt = new Date(); // Update the updatedAt field on every update
				},
			},
		}
	);

	await UserSession.sync();
	return UserSession;
}

const UserSessionModelPromise = initializeUserSessionModel();
export default UserSessionModelPromise;
