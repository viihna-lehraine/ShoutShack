import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

interface AuditLogAttributes {
	auditId: string;
	id?: string | null;
	actionType: string;
	actionDescription?: string | null;
	affectedResource?: string | null;
	previousValue?: string | null;
	newValue?: string | null;
	ipAddress: string;
	userAgent: string;
	auditLogDate: Date;
	auditLogUpdateDate?: Date | null;
}

class AuditLog
	extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>>
	implements AuditLogAttributes
{
	public auditId!: string;
	public id?: string | null;
	public actionType!: string;
	public actionDescription!: string | null;
	public affectedResource!: string | null;
	public previousValue!: string | null;
	public newValue!: string | null;
	public ipAddress!: string;
	public userAgent!: string;
	public auditLogDate!: Date;
	public auditLogUpdateDate?: Date | null;
}

export default function createAuditLogModel(
	sequelize: Sequelize
): typeof AuditLog | null {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();

	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

		AuditLog.init(
			{
				auditId: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true
				},
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					unique: true,
					allowNull: true,
					references: {
						model: User,
						key: 'id'
					}
				},
				actionType: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [
							[
								'create',
								'update',
								'delete',
								'read',
								'login',
								'logout',
								'other'
							]
						]
					}
				},
				actionDescription: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				affectedResource: {
					type: DataTypes.STRING,
					allowNull: true
				},
				previousValue: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				newValue: {
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
				auditLogDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				auditLogUpdateDate: {
					type: DataTypes.DATE,
					defaultValue: undefined,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'AuditLog',
				timestamps: true
			}
		);

		logger.debug('AuditLog model initialized successfully');
		return AuditLog;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize AuditLog model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logInfo(databaseError.message);
		errorHandler.handleError({ error: databaseError });
		return null;
	}
}

export { AuditLog };
