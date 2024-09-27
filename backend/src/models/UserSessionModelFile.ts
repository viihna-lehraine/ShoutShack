import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

interface UserSessionAttributes {
	id: string; // UUID for the session record, primary key (from User model)
	sessionId: number;
	ipAddress: string;
	userAgent: string;
	createdAt: Date;
	updatedAt?: Date | null;
	expiresAt: Date;
	isActive: boolean;
}

export class UserSession
	extends Model<
		InferAttributes<UserSession>,
		InferCreationAttributes<UserSession>
	>
	implements UserSessionAttributes
{
	public id!: string;
	public sessionId!: number;
	public ipAddress!: string;
	public userAgent!: string;
	public createdAt!: CreationOptional<Date>;
	public updatedAt!: Date | null;
	public expiresAt!: Date;
	public isActive!: boolean;
}

export default function createUserSessionModel(
	sequelize: Sequelize
): typeof UserSession {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

		UserSession.init(
			{
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true,
					references: {
						model: User,
						key: 'id'
					}
				},
				sessionId: {
					type: DataTypes.INTEGER,
					primaryKey: true,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				ipAddress: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIP: true
					}
				},
				userAgent: {
					type: DataTypes.STRING,
					allowNull: false
				},
				createdAt: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				updatedAt: {
					type: DataTypes.DATE,
					allowNull: true,
					defaultValue: undefined
				},
				expiresAt: {
					type: DataTypes.DATE,
					allowNull: false
				},
				isActive: {
					type: DataTypes.BOOLEAN,
					defaultValue: true,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'UserSession',
				timestamps: true,
				hooks: {
					beforeCreate: (session: UserSession) => {
						try {
							session.expiresAt = new Date(
								(session.createdAt as Date).getTime() +
									60 * 60000
							); // default: session expires after 60 minutes
							logger.debug(
								'Session expiration time set to 60 minutes'
							);
						} catch (error) {
							errorHandler.handleError({ error });
							throw error;
						}
					},
					beforeUpdate: (session: UserSession) => {
						try {
							session.updatedAt = new Date();
							logger.debug('Session updatedAt field updated');
						} catch (error) {
							errorHandler.handleError({ error });
							throw error;
						}
					}
				}
			}
		);

		return UserSession;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize UserSession model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return {} as typeof UserSession;
	}
}
