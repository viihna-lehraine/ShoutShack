import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db';
import UserModelPromise from './User';
class Device extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'deviceId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'deviceName', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'deviceType', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'os', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'browser', {
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
		Object.defineProperty(this, 'lastUsed', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isTrusted', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'creationDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'lastUpdated', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
// Initialize the Device model
function initializeDeviceModel() {
	return __awaiter(this, void 0, void 0, function* () {
		const sequelize = yield initializeDatabase();
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
					primaryKey: true,
					allowNull: false,
					unique: true,
					references: {
						model: yield UserModelPromise,
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
					allowNull: false
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
				timestamps: true
			}
		);
		yield Device.sync();
		return Device;
	});
}
// Export the initialized model
const DeviceModelPromise = initializeDeviceModel();
export default DeviceModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvbW9kZWxzL0RldmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUNOLFNBQVMsRUFDVCxLQUFLLEVBSUwsTUFBTSxXQUFXLENBQUM7QUFDbkIsT0FBTyxrQkFBa0IsTUFBTSxjQUFjLENBQUM7QUFDOUMsT0FBTyxnQkFBZ0IsTUFBTSxRQUFRLENBQUM7QUFnQnRDLE1BQU0sTUFDTCxTQUFRLEtBQStEO0lBRHhFOztRQUlDOzs7OztXQUFrQjtRQUNsQjs7Ozs7V0FBWTtRQUNaOzs7OztXQUFvQjtRQUNwQjs7Ozs7V0FBb0I7UUFDcEI7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBd0I7UUFDeEI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFrQztRQUNsQzs7Ozs7V0FBb0I7UUFDcEI7Ozs7O1dBQXNDO1FBQ3RDOzs7OztXQUFxQztJQUN0QyxDQUFDO0NBQUE7QUFFRCw4QkFBOEI7QUFDOUIsU0FBZSxxQkFBcUI7O1FBQ25DLE1BQU0sU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxNQUFNLENBQUMsSUFBSSxDQUNWO1lBQ0MsUUFBUSxFQUFFO2dCQUNULElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsTUFBTSxFQUFFLElBQUk7YUFDWjtZQUNELEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO29CQUM3QixHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsVUFBVSxFQUFFO2dCQUNYLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELFVBQVUsRUFBRTtnQkFDWCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFFBQVEsRUFBRTtvQkFDVCxJQUFJLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDMUQ7YUFDRDtZQUNELEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxPQUFPLEVBQUU7Z0JBQ1IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELFlBQVksRUFBRTtnQkFDYixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztnQkFDM0IsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxXQUFXLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7U0FDRCxFQUNEO1lBQ0MsU0FBUztZQUNULFNBQVMsRUFBRSxRQUFRO1lBQ25CLFVBQVUsRUFBRSxJQUFJO1NBQ2hCLENBQ0QsQ0FBQztRQUVGLE1BQU0sTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3BCLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztDQUFBO0FBRUQsK0JBQStCO0FBQy9CLE1BQU0sa0JBQWtCLEdBQUcscUJBQXFCLEVBQUUsQ0FBQztBQUNuRCxlQUFlLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0RGF0YVR5cGVzLFxuXHRNb2RlbCxcblx0SW5mZXJBdHRyaWJ1dGVzLFxuXHRJbmZlckNyZWF0aW9uQXR0cmlidXRlcyxcblx0Q3JlYXRpb25PcHRpb25hbFxufSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IGluaXRpYWxpemVEYXRhYmFzZSBmcm9tICcuLi9jb25maWcvZGInO1xuaW1wb3J0IFVzZXJNb2RlbFByb21pc2UgZnJvbSAnLi9Vc2VyJztcblxuaW50ZXJmYWNlIERldmljZUF0dHJpYnV0ZXMge1xuXHRkZXZpY2VJZDogbnVtYmVyO1xuXHRpZDogc3RyaW5nO1xuXHRkZXZpY2VOYW1lOiBzdHJpbmc7XG5cdGRldmljZVR5cGU6IHN0cmluZztcblx0b3M6IHN0cmluZztcblx0YnJvd3Nlcj86IHN0cmluZyB8IG51bGw7XG5cdGlwQWRkcmVzczogc3RyaW5nO1xuXHRsYXN0VXNlZDogRGF0ZTtcblx0aXNUcnVzdGVkOiBib29sZWFuO1xuXHRjcmVhdGlvbkRhdGU6IERhdGU7XG5cdGxhc3RVcGRhdGVkOiBEYXRlO1xufVxuXG5jbGFzcyBEZXZpY2Vcblx0ZXh0ZW5kcyBNb2RlbDxJbmZlckF0dHJpYnV0ZXM8RGV2aWNlPiwgSW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXM8RGV2aWNlPj5cblx0aW1wbGVtZW50cyBEZXZpY2VBdHRyaWJ1dGVzXG57XG5cdGRldmljZUlkITogbnVtYmVyO1xuXHRpZCE6IHN0cmluZztcblx0ZGV2aWNlTmFtZSE6IHN0cmluZztcblx0ZGV2aWNlVHlwZSE6IHN0cmluZztcblx0b3MhOiBzdHJpbmc7XG5cdGJyb3dzZXIhOiBzdHJpbmcgfCBudWxsO1xuXHRpcEFkZHJlc3MhOiBzdHJpbmc7XG5cdGxhc3RVc2VkITogQ3JlYXRpb25PcHRpb25hbDxEYXRlPjtcblx0aXNUcnVzdGVkITogYm9vbGVhbjtcblx0Y3JlYXRpb25EYXRlITogQ3JlYXRpb25PcHRpb25hbDxEYXRlPjtcblx0bGFzdFVwZGF0ZWQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG4vLyBJbml0aWFsaXplIHRoZSBEZXZpY2UgbW9kZWxcbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVEZXZpY2VNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBEZXZpY2U+IHtcblx0Y29uc3Qgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cblx0RGV2aWNlLmluaXQoXG5cdFx0e1xuXHRcdFx0ZGV2aWNlSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBhd2FpdCBVc2VyTW9kZWxQcm9taXNlLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZGV2aWNlTmFtZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRkZXZpY2VUeXBlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRpc0luOiBbWydkZXNrdG9wJywgJ2xhcHRvcCcsICd0YWJsZXQnLCAnbW9iaWxlJywgJ290aGVyJ11dXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRicm93c2VyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlwQWRkcmVzczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0bGFzdFVzZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXNUcnVzdGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y3JlYXRpb25EYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRsYXN0VXBkYXRlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0RldmljZScsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGF3YWl0IERldmljZS5zeW5jKCk7XG5cdHJldHVybiBEZXZpY2U7XG59XG5cbi8vIEV4cG9ydCB0aGUgaW5pdGlhbGl6ZWQgbW9kZWxcbmNvbnN0IERldmljZU1vZGVsUHJvbWlzZSA9IGluaXRpYWxpemVEZXZpY2VNb2RlbCgpO1xuZXhwb3J0IGRlZmF1bHQgRGV2aWNlTW9kZWxQcm9taXNlO1xuIl19
