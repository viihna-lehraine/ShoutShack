import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface AuditLogAttributes {
	auditId: string;
	id: string;
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
	auditId!: string;
	id!: string;
	actionType!: string;
	actionDescription!: string | null;
	affectedResource!: string | null;
	previousValue!: string | null;
	newValue!: string | null;
	ipAddress!: string;
	userAgent!: string;
	auditLogDate!: Date;
	auditLogUpdateDate?: Date | null;
}

export default function createAuditLogModel(
	sequelize: Sequelize
): typeof AuditLog {
	AuditLog.init(
		{
			auditId: {
				type: DataTypes.INTEGER,
				primaryKey: true, // primary key for the audit log record
				autoIncrement: true, // auto-increment for unique audit logs
				allowNull: false, // audit ID is required
				unique: true // ensure uniqueness of the audit ID
			},
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				allowNull: false, // user ID is required as it references the User model
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			actionType: {
				type: DataTypes.STRING,
				allowNull: false, // action type is required
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
				} // validate that the action type is one of the allowed values
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
				allowNull: false, // IP address is required
				validate: {
					isIP: true // validate that the IP address is in the correct format
				}
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false // user agent is required
			},
			auditLogDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
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
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	return AuditLog;
}
