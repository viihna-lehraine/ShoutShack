import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

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

// Initialize the AuditLog model
const sequelize = getSequelizeInstance();

AuditLog.init(
	{
		auditId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false,
			unique: true
		},
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
			unique: true,
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
			allowNull: false
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
			defaultValue: null,
			allowNull: true
		}
	},
	{
		sequelize,
		modelName: 'AuditLog',
		timestamps: true
	}
);

export default AuditLog;
