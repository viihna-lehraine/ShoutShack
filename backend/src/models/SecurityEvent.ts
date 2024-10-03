import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model
} from 'sequelize';
import { User } from './User';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';
import { SecurityEventAttributes } from '../index/interfaces/models';

class SecurityEvent
	extends Model<
		InferAttributes<SecurityEvent>,
		InferCreationAttributes<SecurityEvent>
	>
	implements SecurityEventAttributes
{
	public id!: string;
	public eventId!: string;
	public eventType!: string;
	public eventDescription!: string | null;
	public ipAddress!: string;
	public userAgent!: string;
	public securityEventDate!: Date;
	public securityEventLastUpdated!: CreationOptional<Date>;
}

export function createSecurityEventModel(): typeof SecurityEvent | null {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	try {
		const sequelize =
			ServiceFactory.getDatabaseController().getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize SecurityEvent model: Sequelize instance not found',
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

		SecurityEvent.init(
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
				eventId: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				eventType: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [
							[
								'login',
								'failed-login',
								'password-change',
								'2fa-enabled',
								'2fa-disabled',
								'account-lock',
								'other'
							]
						]
					}
				},
				eventDescription: {
					type: DataTypes.TEXT,
					allowNull: true
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
				securityEventDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				securityEventLastUpdated: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'SecurityEvent',
				timestamps: true
			}
		);

		return SecurityEvent;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize SecurityEvent model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logInfo(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}
