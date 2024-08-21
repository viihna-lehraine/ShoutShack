import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

interface SecurityEventAttributes {
	id: string;
	eventId: string;
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
	id!: string;
	eventId!: string;
	eventType!: string;
	eventDescription!: string | null;
	ipAddress!: string;
	userAgent!: string;
	securityEventDate!: Date;
	securityEventLastUpdated!: CreationOptional<Date>;
}

// Get the Sequelize instance
const sequelize = getSequelizeInstance();

// Initialize the SecurityEvent model
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
			allowNull: true,
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
			allowNull: false
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

export default SecurityEvent;
