import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';

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

export default function createSecurityEventModel(
	sequelize: Sequelize
): typeof SecurityEvent {
	SecurityEvent.init(
		{
			id: {
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			eventId: {
				type: DataTypes.STRING,
				allowNull: false
			},
			eventType: {
				type: DataTypes.STRING,
				allowNull: false
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
				allowNull: false
			},
			securityEventLastUpdated: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			}
		},
		{
			sequelize,
			tableName: 'SecurityEvents',
			timestamps: false
		}
	);

	return SecurityEvent;
}
