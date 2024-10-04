import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes
} from 'sequelize';
import { User } from './User';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';
import { UserSessionAttributes } from '../index/interfaces/models';

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

export async function createUserSessionModel(): Promise<
	typeof UserSession | null
> {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();

	try {
		const databaseController = await ServiceFactory.getDatabaseController();
		const sequelize = databaseController.getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize UserSession model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}
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
