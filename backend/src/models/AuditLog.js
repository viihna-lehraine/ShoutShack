import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';
class AuditLog extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'auditId', {
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
		Object.defineProperty(this, 'actionType', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'actionDescription', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'affectedResource', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'previousValue', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'newValue', {
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
		Object.defineProperty(this, 'auditLogDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'auditLogUpdateDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
// Initialize the AuditLog model
function initializeAuditLogModel() {
	return __awaiter(this, void 0, void 0, function* () {
		let sequelize = yield initializeDatabase();
		AuditLog.init(
			{
				auditId: {
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
					unique: true,
					references: {
						model: yield UserModelPromise,
						key: 'id'
					}
				},
				actionType: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [
							[
								'create',
								'update',
								'delete',
								'read',
								'login',
								'logout',
								'other'
							]
						]
					}
				},
				actionDescription: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				affectedResource: {
					type: DataTypes.STRING,
					allowNull: true
				},
				previousValue: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				newValue: {
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
				auditLogDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				auditLogUpdateDate: {
					type: DataTypes.DATE,
					defaultValue: false,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'AuditLog',
				timestamps: true
			}
		);
		yield AuditLog.sync();
		return AuditLog;
	});
}
const AuditLogModelPromise = initializeAuditLogModel();
export default AuditLogModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVkaXRMb2cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvQXVkaXRMb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUdMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBZ0J0QyxNQUFNLFFBQ0wsU0FBUSxLQUFtRTtJQUQ1RTs7UUFJQzs7Ozs7V0FBaUI7UUFDakI7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBb0I7UUFDcEI7Ozs7O1dBQWtDO1FBQ2xDOzs7OztXQUFpQztRQUNqQzs7Ozs7V0FBOEI7UUFDOUI7Ozs7O1dBQXlCO1FBQ3pCOzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBbUI7UUFDbkI7Ozs7O1dBQW9CO1FBQ3BCOzs7OztXQUFpQztJQUNsQyxDQUFDO0NBQUE7QUFFRCxnQ0FBZ0M7QUFDaEMsU0FBZSx1QkFBdUI7O1FBQ3JDLElBQUksU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUUzQyxRQUFRLENBQUMsSUFBSSxDQUNaO1lBQ0MsT0FBTyxFQUFFO2dCQUNSLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsTUFBTSxFQUFFLElBQUk7YUFDWjtZQUNELEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRTtvQkFDWCxLQUFLLEVBQUUsTUFBTSxnQkFBZ0I7b0JBQzdCLEdBQUcsRUFBRSxJQUFJO2lCQUNUO2FBQ0Q7WUFDRCxVQUFVLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsUUFBUSxFQUFFO29CQUNULElBQUksRUFBRTt3QkFDTDs0QkFDQyxRQUFROzRCQUNSLFFBQVE7NEJBQ1IsUUFBUTs0QkFDUixNQUFNOzRCQUNOLE9BQU87NEJBQ1AsUUFBUTs0QkFDUixPQUFPO3lCQUNQO3FCQUNEO2lCQUNEO2FBQ0Q7WUFDRCxpQkFBaUIsRUFBRTtnQkFDbEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2pCLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELGFBQWEsRUFBRTtnQkFDZCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELFlBQVksRUFBRTtnQkFDYixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztnQkFDM0IsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxrQkFBa0IsRUFBRTtnQkFDbkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsS0FBSztnQkFDbkIsU0FBUyxFQUFFLElBQUk7YUFDZjtTQUNELEVBQ0Q7WUFDQyxTQUFTO1lBQ1QsU0FBUyxFQUFFLFVBQVU7WUFDckIsVUFBVSxFQUFFLElBQUk7U0FDaEIsQ0FDRCxDQUFDO1FBRUYsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsT0FBTyxRQUFRLENBQUM7SUFDakIsQ0FBQztDQUFBO0FBRUQsTUFBTSxvQkFBb0IsR0FBRyx1QkFBdUIsRUFBRSxDQUFDO0FBQ3ZELGVBQWUsb0JBQW9CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgVXNlck1vZGVsUHJvbWlzZSBmcm9tICcuL1VzZXInO1xuXG5pbnRlcmZhY2UgQXVkaXRMb2dBdHRyaWJ1dGVzIHtcblx0YXVkaXRJZDogc3RyaW5nO1xuXHRpZDogc3RyaW5nO1xuXHRhY3Rpb25UeXBlOiBzdHJpbmc7XG5cdGFjdGlvbkRlc2NyaXB0aW9uPzogc3RyaW5nIHwgbnVsbDtcblx0YWZmZWN0ZWRSZXNvdXJjZT86IHN0cmluZyB8IG51bGw7XG5cdHByZXZpb3VzVmFsdWU/OiBzdHJpbmcgfCBudWxsO1xuXHRuZXdWYWx1ZT86IHN0cmluZyB8IG51bGw7XG5cdGlwQWRkcmVzczogc3RyaW5nO1xuXHR1c2VyQWdlbnQ6IHN0cmluZztcblx0YXVkaXRMb2dEYXRlOiBEYXRlO1xuXHRhdWRpdExvZ1VwZGF0ZURhdGU/OiBEYXRlIHwgbnVsbDtcbn1cblxuY2xhc3MgQXVkaXRMb2dcblx0ZXh0ZW5kcyBNb2RlbDxJbmZlckF0dHJpYnV0ZXM8QXVkaXRMb2c+LCBJbmZlckNyZWF0aW9uQXR0cmlidXRlczxBdWRpdExvZz4+XG5cdGltcGxlbWVudHMgQXVkaXRMb2dBdHRyaWJ1dGVzXG57XG5cdGF1ZGl0SWQhOiBzdHJpbmc7XG5cdGlkITogc3RyaW5nO1xuXHRhY3Rpb25UeXBlITogc3RyaW5nO1xuXHRhY3Rpb25EZXNjcmlwdGlvbiE6IHN0cmluZyB8IG51bGw7XG5cdGFmZmVjdGVkUmVzb3VyY2UhOiBzdHJpbmcgfCBudWxsO1xuXHRwcmV2aW91c1ZhbHVlITogc3RyaW5nIHwgbnVsbDtcblx0bmV3VmFsdWUhOiBzdHJpbmcgfCBudWxsO1xuXHRpcEFkZHJlc3MhOiBzdHJpbmc7XG5cdHVzZXJBZ2VudCE6IHN0cmluZztcblx0YXVkaXRMb2dEYXRlITogRGF0ZTtcblx0YXVkaXRMb2dVcGRhdGVEYXRlPzogRGF0ZSB8IG51bGw7XG59XG5cbi8vIEluaXRpYWxpemUgdGhlIEF1ZGl0TG9nIG1vZGVsXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplQXVkaXRMb2dNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBBdWRpdExvZz4ge1xuXHRsZXQgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cblx0QXVkaXRMb2cuaW5pdChcblx0XHR7XG5cdFx0XHRhdWRpdElkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogYXdhaXQgVXNlck1vZGVsUHJvbWlzZSxcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGFjdGlvblR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRpc0luOiBbXG5cdFx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRcdCdjcmVhdGUnLFxuXHRcdFx0XHRcdFx0XHQndXBkYXRlJyxcblx0XHRcdFx0XHRcdFx0J2RlbGV0ZScsXG5cdFx0XHRcdFx0XHRcdCdyZWFkJyxcblx0XHRcdFx0XHRcdFx0J2xvZ2luJyxcblx0XHRcdFx0XHRcdFx0J2xvZ291dCcsXG5cdFx0XHRcdFx0XHRcdCdvdGhlcidcblx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHRdXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhY3Rpb25EZXNjcmlwdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YWZmZWN0ZWRSZXNvdXJjZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwcmV2aW91c1ZhbHVlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRuZXdWYWx1ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1c2VyQWdlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGF1ZGl0TG9nRGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YXVkaXRMb2dVcGRhdGVEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0F1ZGl0TG9nJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0YXdhaXQgQXVkaXRMb2cuc3luYygpO1xuXHRyZXR1cm4gQXVkaXRMb2c7XG59XG5cbmNvbnN0IEF1ZGl0TG9nTW9kZWxQcm9taXNlID0gaW5pdGlhbGl6ZUF1ZGl0TG9nTW9kZWwoKTtcbmV4cG9ydCBkZWZhdWx0IEF1ZGl0TG9nTW9kZWxQcm9taXNlO1xuIl19
