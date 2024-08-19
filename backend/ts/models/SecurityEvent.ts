import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface SecurityEventAttributes {
	eventId: string;
	userId: string;
	eventType: string;
	eventDescription?: string | null;
	ipAddress: string;
	userAgent: string;
	createdAt: Date;
	updatedAt: Date;
}

class SecurityEvent extends Model<InferAttributes<SecurityEvent>, InferCreationAttributes<SecurityEvent>> implements SecurityEventAttributes {
	eventId!: string;
	userId!: string;
	eventType!: string;
	eventDescription!: string | null;
	ipAddress!: string;
	userAgent!: string;
	createdAt!: CreationOptional<Date>;
	updatedAt!: CreationOptional<Date>;
}

async function initializeSecurityEventModel(): Promise<typeof SecurityEvent> {
	const sequelize = await initializeDatabase();

	SecurityEvent.init(
		{
			eventId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
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
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			updatedAt: {
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
