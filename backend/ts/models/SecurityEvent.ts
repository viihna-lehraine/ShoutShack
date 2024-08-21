import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model
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

export default SecurityEvent;
