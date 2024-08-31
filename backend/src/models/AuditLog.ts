import {
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';

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
				type: DataTypes.STRING,
				allowNull: false
			},
			id: {
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			actionType: {
				type: DataTypes.STRING,
				allowNull: false
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
				type: DataTypes.STRING,
				allowNull: true
			},
			newValue: {
				type: DataTypes.STRING,
				allowNull: true
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			auditLogDate: {
				type: DataTypes.DATE,
				allowNull: false
			},
			auditLogUpdateDate: {
				type: DataTypes.DATE,
				allowNull: true
			}
		},
		{
			sequelize,
			tableName: 'AuditLogs',
			timestamps: false
		}
	);

	return AuditLog;
}
