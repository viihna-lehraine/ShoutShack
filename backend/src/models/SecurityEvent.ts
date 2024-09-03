import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

interface SecurityEventAttributes {
	id: string; // UUID for security event, primary key
	eventId: string; // unique event ID, auto-incremented
	eventType: string; // type of security event
	eventDescription?: string | null; // optional description of the security event
	ipAddress: string; // IP address associated with the security event
	userAgent: string; // user agent associated with the security event
	securityEventDate: Date; // date of the security event
	securityEventLastUpdated: Date; // date when the security event was last updated
}

class SecurityEvent
	extends Model<
		InferAttributes<SecurityEvent>,
		InferCreationAttributes<SecurityEvent>
	>
	implements SecurityEventAttributes
{
	id!: string; // initialized as a non-nullable string (UUID)
	eventId!: string; // initialized as a non-nullable string (UUID)
	eventType!: string; // initialized as a non-nullable string
	eventDescription!: string | null; // nullable, may contain string or null
	ipAddress!: string; // initialized as a non-nullable string that will be validated as an IP address
	userAgent!: string; // initialized as a non-nullable string
	securityEventDate!: Date; // initialized as a non-nullable date
	securityEventLastUpdated!: CreationOptional<Date>; // optional field, defaults to current date
}

export default function createSecurityEventModel(
	sequelize: Sequelize
): typeof SecurityEvent {
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
				allowNull: false, // event ID is required
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
				allowNull: true // event description is optional
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false, // IP address is required
				validate: {
					isIP: true
				}
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false // user agent is required
			},
			securityEventDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false // security event date is required
			},
			securityEventLastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false // security event last updated date is required
			}
		},
		{
			sequelize,
			modelName: 'SecurityEvent',
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	return SecurityEvent;
}
