import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';
class SecurityEvent extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'eventId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'eventType', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'eventDescription', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'ipAddress', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'userAgent', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'securityEventDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'securityEventLastUpdated', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
function initializeSecurityEventModel() {
	return __awaiter(this, void 0, void 0, function* () {
		let sequelize = yield initializeDatabase();
		SecurityEvent.init(
			{
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true,
					references: {
						model: yield UserModelPromise,
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
		yield SecurityEvent.sync();
		return SecurityEvent;
	});
}
const SecurityEventModelPromise = initializeSecurityEventModel();
export default SecurityEventModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VjdXJpdHlFdmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9TZWN1cml0eUV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQ04sU0FBUyxFQUdULEtBQUssRUFFTCxNQUFNLFdBQVcsQ0FBQztBQUNuQixPQUFPLGtCQUFrQixNQUFNLGNBQWMsQ0FBQztBQUM5QyxPQUFPLGdCQUFnQixNQUFNLFFBQVEsQ0FBQztBQWF0QyxNQUFNLGFBQ0wsU0FBUSxLQUdQO0lBSkY7O1FBT0M7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBaUI7UUFDakI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFpQztRQUNqQzs7Ozs7V0FBbUI7UUFDbkI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUF5QjtRQUN6Qjs7Ozs7V0FBa0Q7SUFDbkQsQ0FBQztDQUFBO0FBRUQsU0FBZSw0QkFBNEI7O1FBQzFDLElBQUksU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUUzQyxhQUFhLENBQUMsSUFBSSxDQUNqQjtZQUNDLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO29CQUM3QixHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsT0FBTyxFQUFFO2dCQUNSLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE1BQU0sRUFBRSxJQUFJO2FBQ1o7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsUUFBUSxFQUFFO29CQUNULElBQUksRUFBRTt3QkFDTDs0QkFDQyxPQUFPOzRCQUNQLGNBQWM7NEJBQ2QsaUJBQWlCOzRCQUNqQixhQUFhOzRCQUNiLGNBQWM7NEJBQ2QsY0FBYzs0QkFDZCxPQUFPO3lCQUNQO3FCQUNEO2lCQUNEO2FBQ0Q7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDakIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELGlCQUFpQixFQUFFO2dCQUNsQixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztnQkFDM0IsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCx3QkFBd0IsRUFBRTtnQkFDekIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1NBQ0QsRUFDRDtZQUNDLFNBQVM7WUFDVCxTQUFTLEVBQUUsZUFBZTtZQUMxQixVQUFVLEVBQUUsSUFBSTtTQUNoQixDQUNELENBQUM7UUFFRixNQUFNLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzQixPQUFPLGFBQWEsQ0FBQztJQUN0QixDQUFDO0NBQUE7QUFFRCxNQUFNLHlCQUF5QixHQUFHLDRCQUE0QixFQUFFLENBQUM7QUFDakUsZUFBZSx5QkFBeUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdERhdGFUeXBlcyxcblx0SW5mZXJBdHRyaWJ1dGVzLFxuXHRJbmZlckNyZWF0aW9uQXR0cmlidXRlcyxcblx0TW9kZWwsXG5cdENyZWF0aW9uT3B0aW9uYWxcbn0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCBpbml0aWFsaXplRGF0YWJhc2UgZnJvbSAnLi4vY29uZmlnL2RiJztcbmltcG9ydCBVc2VyTW9kZWxQcm9taXNlIGZyb20gJy4vVXNlcic7XG5cbmludGVyZmFjZSBTZWN1cml0eUV2ZW50QXR0cmlidXRlcyB7XG5cdGlkOiBzdHJpbmc7XG5cdGV2ZW50SWQ6IHN0cmluZztcblx0ZXZlbnRUeXBlOiBzdHJpbmc7XG5cdGV2ZW50RGVzY3JpcHRpb24/OiBzdHJpbmcgfCBudWxsO1xuXHRpcEFkZHJlc3M6IHN0cmluZztcblx0dXNlckFnZW50OiBzdHJpbmc7XG5cdHNlY3VyaXR5RXZlbnREYXRlOiBEYXRlO1xuXHRzZWN1cml0eUV2ZW50TGFzdFVwZGF0ZWQ6IERhdGU7XG59XG5cbmNsYXNzIFNlY3VyaXR5RXZlbnRcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8U2VjdXJpdHlFdmVudD4sXG5cdFx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXM8U2VjdXJpdHlFdmVudD5cblx0PlxuXHRpbXBsZW1lbnRzIFNlY3VyaXR5RXZlbnRBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRldmVudElkITogc3RyaW5nO1xuXHRldmVudFR5cGUhOiBzdHJpbmc7XG5cdGV2ZW50RGVzY3JpcHRpb24hOiBzdHJpbmcgfCBudWxsO1xuXHRpcEFkZHJlc3MhOiBzdHJpbmc7XG5cdHVzZXJBZ2VudCE6IHN0cmluZztcblx0c2VjdXJpdHlFdmVudERhdGUhOiBEYXRlO1xuXHRzZWN1cml0eUV2ZW50TGFzdFVwZGF0ZWQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplU2VjdXJpdHlFdmVudE1vZGVsKCk6IFByb21pc2U8dHlwZW9mIFNlY3VyaXR5RXZlbnQ+IHtcblx0bGV0IHNlcXVlbGl6ZSA9IGF3YWl0IGluaXRpYWxpemVEYXRhYmFzZSgpO1xuXG5cdFNlY3VyaXR5RXZlbnQuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogYXdhaXQgVXNlck1vZGVsUHJvbWlzZSxcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGV2ZW50SWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRUeXBlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0aXNJbjogW1xuXHRcdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0XHQnbG9naW4nLFxuXHRcdFx0XHRcdFx0XHQnZmFpbGVkLWxvZ2luJyxcblx0XHRcdFx0XHRcdFx0J3Bhc3N3b3JkLWNoYW5nZScsXG5cdFx0XHRcdFx0XHRcdCcyZmEtZW5hYmxlZCcsXG5cdFx0XHRcdFx0XHRcdCcyZmEtZGlzYWJsZWQnLFxuXHRcdFx0XHRcdFx0XHQnYWNjb3VudC1sb2NrJyxcblx0XHRcdFx0XHRcdFx0J290aGVyJ1xuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdF1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGV2ZW50RGVzY3JpcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlwQWRkcmVzczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dXNlckFnZW50OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzZWN1cml0eUV2ZW50RGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c2VjdXJpdHlFdmVudExhc3RVcGRhdGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ1NlY3VyaXR5RXZlbnQnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRhd2FpdCBTZWN1cml0eUV2ZW50LnN5bmMoKTtcblx0cmV0dXJuIFNlY3VyaXR5RXZlbnQ7XG59XG5cbmNvbnN0IFNlY3VyaXR5RXZlbnRNb2RlbFByb21pc2UgPSBpbml0aWFsaXplU2VjdXJpdHlFdmVudE1vZGVsKCk7XG5leHBvcnQgZGVmYXVsdCBTZWN1cml0eUV2ZW50TW9kZWxQcm9taXNlO1xuIl19
