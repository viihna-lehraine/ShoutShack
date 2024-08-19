import { DataTypes, InferAttributes, InferCreationAttributes, Model, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';

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

class SecurityEvent extends Model<InferAttributes<SecurityEvent>, InferCreationAttributes<SecurityEvent>> implements SecurityEventAttributes {
	id!: string;
	eventId!: string;
	eventType!: string;
	eventDescription!: string | null;
	ipAddress!: string;
	userAgent!: string;
	securityEventDate!: Date;
	securityEventLastUpdated!: CreationOptional<Date>;
}

async function initializeSecurityEventModel(): Promise<typeof SecurityEvent> {
	const sequelize = await initializeDatabase();

	SecurityEvent.init(
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
			eventId: {
				type: DataTypes.INTEGER,
				autoIncrement: true, 
				allowNull: true,
				unique: true,
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
							'other',
						],
					],
				},
			},
			eventDescription: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			securityEventDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			securityEventLastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'SecurityEvent',
			timestamps: true,
		}
	);

	await SecurityEvent.sync();
	return SecurityEvent;
}

const SecurityEventModelPromise = initializeSecurityEventModel();
export default SecurityEventModelPromise;
