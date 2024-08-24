import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	CreationOptional
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
declare class SecurityEvent
	extends Model<
		InferAttributes<SecurityEvent>,
		InferCreationAttributes<SecurityEvent>
	>
	implements SecurityEventAttributes
{
	id: string;
	eventId: string;
	eventType: string;
	eventDescription: string | null;
	ipAddress: string;
	userAgent: string;
	securityEventDate: Date;
	securityEventLastUpdated: CreationOptional<Date>;
}
declare const SecurityEventModelPromise: Promise<typeof SecurityEvent>;
export default SecurityEventModelPromise;
//# sourceMappingURL=SecurityEvent.d.ts.map
