import { DataTypes, Model } from 'sequelize';
import { User } from './User.mjs';
import { processError } from '../utils/processError.mjs';
import { validateDependencies } from '../utils/validateDependencies.mjs';
class Device extends Model {
	deviceId;
	id;
	deviceName;
	deviceType;
	os;
	browser;
	ipAddress;
	lastUsed;
	isTrusted;
	creationDate;
	lastUpdated;
}
export default function createDeviceModel(sequelize, logger) {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);
		Device.init(
			{
				deviceId: {
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
					references: {
						model: User,
						key: 'id'
					}
				},
				deviceName: {
					type: DataTypes.STRING,
					allowNull: true
				},
				deviceType: {
					type: DataTypes.STRING,
					allowNull: true,
					validate: {
						isIn: [
							['desktop', 'laptop', 'tablet', 'mobile', 'other']
						]
					}
				},
				os: {
					type: DataTypes.STRING,
					allowNull: true
				},
				browser: {
					type: DataTypes.STRING,
					allowNull: true
				},
				ipAddress: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIP: true
					}
				},
				lastUsed: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: true
				},
				isTrusted: {
					type: DataTypes.BOOLEAN,
					defaultValue: false
				},
				creationDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				lastUpdated: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'Device',
				timestamps: true,
				updatedAt: 'lastUpdated'
			}
		);
		logger.info('Device model initialized successfully');
		return Device;
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}
export { Device };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21vZGVscy9EZXZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVOLFNBQVMsRUFHVCxLQUFLLEVBRUwsTUFBTSxXQUFXLENBQUM7QUFDbkIsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUU5QixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFnQnJFLE1BQU0sTUFDTCxTQUFRLEtBQStEO0lBR2hFLFFBQVEsQ0FBVTtJQUNsQixFQUFFLENBQVU7SUFDWixVQUFVLENBQVU7SUFDcEIsVUFBVSxDQUFVO0lBQ3BCLEVBQUUsQ0FBVTtJQUNaLE9BQU8sQ0FBaUI7SUFDeEIsU0FBUyxDQUFVO0lBQ25CLFFBQVEsQ0FBMEI7SUFDbEMsU0FBUyxDQUFXO0lBQ3BCLFlBQVksQ0FBMEI7SUFDdEMsV0FBVyxDQUEwQjtDQUM1QztBQUVELE1BQU0sQ0FBQyxPQUFPLFVBQVUsaUJBQWlCLENBQ3hDLFNBQW9CLEVBQ3BCLE1BQWM7SUFFZCxJQUFJLENBQUM7UUFDSixvQkFBb0IsQ0FDbkI7WUFDQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtZQUMxQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRTtTQUNwQyxFQUNELE1BQU0sSUFBSSxPQUFPLENBQ2pCLENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUNWO1lBQ0MsUUFBUSxFQUFFO2dCQUNULElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsTUFBTSxFQUFFLElBQUk7YUFDWjtZQUNELEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFVBQVUsRUFBRTtvQkFDWCxLQUFLLEVBQUUsSUFBSTtvQkFDWCxHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsVUFBVSxFQUFFO2dCQUNYLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELFVBQVUsRUFBRTtnQkFDWCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFFBQVEsRUFBRTtvQkFDVCxJQUFJLEVBQUU7d0JBQ0wsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDO3FCQUNsRDtpQkFDRDthQUNEO1lBQ0QsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELE9BQU8sRUFBRTtnQkFDUixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsUUFBUSxFQUFFO29CQUNULElBQUksRUFBRSxJQUFJO2lCQUNWO2FBQ0Q7WUFDRCxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELFlBQVksRUFBRTtnQkFDYixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztnQkFDM0IsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxXQUFXLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7U0FDRCxFQUNEO1lBQ0MsU0FBUztZQUNULFNBQVMsRUFBRSxRQUFRO1lBQ25CLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxhQUFhO1NBQ3hCLENBQ0QsQ0FBQztRQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUMsdUNBQXVDLENBQUMsQ0FBQztRQUNyRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2hCLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sS0FBSyxDQUFDO0lBQ2IsQ0FBQztBQUNGLENBQUM7QUFFRCxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRDcmVhdGlvbk9wdGlvbmFsLFxuXHREYXRhVHlwZXMsXG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsXG5cdE1vZGVsLFxuXHRTZXF1ZWxpemVcbn0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCB7IFVzZXIgfSBmcm9tICcuL1VzZXInO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vY29uZmlnL2xvZ2dlcic7XG5pbXBvcnQgeyBwcm9jZXNzRXJyb3IgfSBmcm9tICcuLi91dGlscy9wcm9jZXNzRXJyb3InO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy92YWxpZGF0ZURlcGVuZGVuY2llcyc7XG5cbmludGVyZmFjZSBEZXZpY2VBdHRyaWJ1dGVzIHtcblx0ZGV2aWNlSWQ6IG51bWJlcjsgLy8gcHJpbWFyeSBrZXksIGF1dG8taW5jcmVtZW50ZWRcblx0aWQ6IHN0cmluZzsgLy8gZm9yZWlnbiBrZXkgdG8gdGhlIFVzZXIgbW9kZWxcblx0ZGV2aWNlTmFtZTogc3RyaW5nO1xuXHRkZXZpY2VUeXBlOiBzdHJpbmc7XG5cdG9zOiBzdHJpbmc7XG5cdGJyb3dzZXI/OiBzdHJpbmcgfCBudWxsO1xuXHRpcEFkZHJlc3M6IHN0cmluZztcblx0bGFzdFVzZWQ6IERhdGU7XG5cdGlzVHJ1c3RlZDogYm9vbGVhbjtcblx0Y3JlYXRpb25EYXRlOiBEYXRlO1xuXHRsYXN0VXBkYXRlZDogRGF0ZTtcbn1cblxuY2xhc3MgRGV2aWNlXG5cdGV4dGVuZHMgTW9kZWw8SW5mZXJBdHRyaWJ1dGVzPERldmljZT4sIEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPERldmljZT4+XG5cdGltcGxlbWVudHMgRGV2aWNlQXR0cmlidXRlc1xue1xuXHRwdWJsaWMgZGV2aWNlSWQhOiBudW1iZXI7XG5cdHB1YmxpYyBpZCE6IHN0cmluZztcblx0cHVibGljIGRldmljZU5hbWUhOiBzdHJpbmc7XG5cdHB1YmxpYyBkZXZpY2VUeXBlITogc3RyaW5nO1xuXHRwdWJsaWMgb3MhOiBzdHJpbmc7XG5cdHB1YmxpYyBicm93c2VyITogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljIGlwQWRkcmVzcyE6IHN0cmluZztcblx0cHVibGljIGxhc3RVc2VkITogQ3JlYXRpb25PcHRpb25hbDxEYXRlPjtcblx0cHVibGljIGlzVHJ1c3RlZCE6IGJvb2xlYW47XG5cdHB1YmxpYyBjcmVhdGlvbkRhdGUhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHRwdWJsaWMgbGFzdFVwZGF0ZWQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVEZXZpY2VNb2RlbChcblx0c2VxdWVsaXplOiBTZXF1ZWxpemUsXG5cdGxvZ2dlcjogTG9nZ2VyXG4pOiB0eXBlb2YgRGV2aWNlIHtcblx0dHJ5IHtcblx0XHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRcdFtcblx0XHRcdFx0eyBuYW1lOiAnc2VxdWVsaXplJywgaW5zdGFuY2U6IHNlcXVlbGl6ZSB9LFxuXHRcdFx0XHR7IG5hbWU6ICdsb2dnZXInLCBpbnN0YW5jZTogbG9nZ2VyIH1cblx0XHRcdF0sXG5cdFx0XHRsb2dnZXIgfHwgY29uc29sZVxuXHRcdCk7XG5cblx0XHREZXZpY2UuaW5pdChcblx0XHRcdHtcblx0XHRcdFx0ZGV2aWNlSWQ6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aWQ6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0ZGV2aWNlTmFtZToge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRldmljZVR5cGU6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdFx0aXNJbjogW1xuXHRcdFx0XHRcdFx0XHRbJ2Rlc2t0b3AnLCAnbGFwdG9wJywgJ3RhYmxldCcsICdtb2JpbGUnLCAnb3RoZXInXVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0b3M6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRicm93c2VyOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0XHRpc0lQOiB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsYXN0VXNlZDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0aXNUcnVzdGVkOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjcmVhdGlvbkRhdGU6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRsYXN0VXBkYXRlZDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0XHRtb2RlbE5hbWU6ICdEZXZpY2UnLFxuXHRcdFx0XHR0aW1lc3RhbXBzOiB0cnVlLFxuXHRcdFx0XHR1cGRhdGVkQXQ6ICdsYXN0VXBkYXRlZCdcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0bG9nZ2VyLmluZm8oJ0RldmljZSBtb2RlbCBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHknKTtcblx0XHRyZXR1cm4gRGV2aWNlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHByb2Nlc3NFcnJvcihlcnJvciwgbG9nZ2VyIHx8IGNvbnNvbGUpO1xuXHRcdHRocm93IGVycm9yO1xuXHR9XG59XG5cbmV4cG9ydCB7IERldmljZSB9O1xuIl19
