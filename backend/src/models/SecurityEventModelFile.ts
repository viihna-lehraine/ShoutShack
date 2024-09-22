import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../services/appLogger';
import { validateDependencies } from '../utils/helpers';

interface SecurityEventAttributes {
	id: string; // UUID for security event, primary key (from User model)
	eventId: string; // unique event ID, auto-incremented
	eventType: string;
	eventDescription?: string | null;
	ipAddress: string;
	userAgent: string;
	securityEventDate: Date;
	securityEventLastUpdated: Date;
}

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

export default function createSecurityEventModel(
	sequelize: Sequelize,
	logger: Logger
): typeof SecurityEvent | null {
	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger || console
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
		const databaseError = new errorClasses.DatabaseErrorRecoverable(
			`Failed to initialize SecurityEvent model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(databaseError.message, logger);
		processError(databaseError, logger);
		return null;
	}
}

export { SecurityEvent };
