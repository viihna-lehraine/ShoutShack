import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';
class SupportRequest extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'email', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'supportTicketNumber', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'supportType', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'supportContent', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isSupportTicketOpen', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'supportTicketOpenDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'supportTicketCloseDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
function initializeSupportRequestModel() {
	return __awaiter(this, void 0, void 0, function* () {
		let sequelize = yield initializeDatabase();
		SupportRequest.init(
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
				email: {
					type: DataTypes.STRING,
					allowNull: false
				},
				supportTicketNumber: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: true,
					unique: true
				},
				supportType: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				supportContent: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				isSupportTicketOpen: {
					type: DataTypes.BOOLEAN,
					defaultValue: true,
					allowNull: false
				},
				supportTicketOpenDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				supportTicketCloseDate: {
					type: DataTypes.DATE,
					allowNull: true,
					defaultValue: null
				}
			},
			{
				sequelize,
				modelName: 'SupportRequest',
				timestamps: true
			}
		);
		yield SupportRequest.sync();
		return SupportRequest;
	});
}
const SupportRequestModelPromise = initializeSupportRequestModel();
export default SupportRequestModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3VwcG9ydFJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvU3VwcG9ydFJlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUdMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBYXRDLE1BQU0sY0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUFlO1FBQ2Y7Ozs7O1dBQTZCO1FBQzdCOzs7OztXQUFxQjtRQUNyQjs7Ozs7V0FBd0I7UUFDeEI7Ozs7O1dBQThCO1FBQzlCOzs7OztXQUE2QjtRQUM3Qjs7Ozs7V0FBcUM7SUFDdEMsQ0FBQztDQUFBO0FBRUQsU0FBZSw2QkFBNkI7O1FBQzNDLElBQUksU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUUzQyxjQUFjLENBQUMsSUFBSSxDQUNsQjtZQUNDLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO29CQUM3QixHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsS0FBSyxFQUFFO2dCQUNOLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxtQkFBbUIsRUFBRTtnQkFDcEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsTUFBTSxFQUFFLElBQUk7YUFDWjtZQUNELFdBQVcsRUFBRTtnQkFDWixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsY0FBYyxFQUFFO2dCQUNmLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxtQkFBbUIsRUFBRTtnQkFDcEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxxQkFBcUIsRUFBRTtnQkFDdEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0Qsc0JBQXNCLEVBQUU7Z0JBQ3ZCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsWUFBWSxFQUFFLElBQUk7YUFDbEI7U0FDRCxFQUNEO1lBQ0MsU0FBUztZQUNULFNBQVMsRUFBRSxnQkFBZ0I7WUFDM0IsVUFBVSxFQUFFLElBQUk7U0FDaEIsQ0FDRCxDQUFDO1FBRUYsTUFBTSxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsT0FBTyxjQUFjLENBQUM7SUFDdkIsQ0FBQztDQUFBO0FBRUQsTUFBTSwwQkFBMEIsR0FBRyw2QkFBNkIsRUFBRSxDQUFDO0FBQ25FLGVBQWUsMEJBQTBCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgVXNlck1vZGVsUHJvbWlzZSBmcm9tICcuL1VzZXInO1xuXG5pbnRlcmZhY2UgU3VwcG9ydFJlcXVlc3RBdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZztcblx0ZW1haWw6IHN0cmluZztcblx0c3VwcG9ydFRpY2tldE51bWJlcjogbnVtYmVyO1xuXHRzdXBwb3J0VHlwZTogc3RyaW5nO1xuXHRzdXBwb3J0Q29udGVudDogc3RyaW5nO1xuXHRpc1N1cHBvcnRUaWNrZXRPcGVuOiBib29sZWFuO1xuXHRzdXBwb3J0VGlja2V0T3BlbkRhdGU6IERhdGU7XG5cdHN1cHBvcnRUaWNrZXRDbG9zZURhdGU/OiBEYXRlIHwgbnVsbDtcbn1cblxuY2xhc3MgU3VwcG9ydFJlcXVlc3Rcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8U3VwcG9ydFJlcXVlc3Q+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPFN1cHBvcnRSZXF1ZXN0PlxuXHQ+XG5cdGltcGxlbWVudHMgU3VwcG9ydFJlcXVlc3RBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRlbWFpbCE6IHN0cmluZztcblx0c3VwcG9ydFRpY2tldE51bWJlciE6IG51bWJlcjtcblx0c3VwcG9ydFR5cGUhOiBzdHJpbmc7XG5cdHN1cHBvcnRDb250ZW50ITogc3RyaW5nO1xuXHRpc1N1cHBvcnRUaWNrZXRPcGVuITogYm9vbGVhbjtcblx0c3VwcG9ydFRpY2tldE9wZW5EYXRlITogRGF0ZTtcblx0c3VwcG9ydFRpY2tldENsb3NlRGF0ZT86IERhdGUgfCBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplU3VwcG9ydFJlcXVlc3RNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBTdXBwb3J0UmVxdWVzdD4ge1xuXHRsZXQgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cblx0U3VwcG9ydFJlcXVlc3QuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogYXdhaXQgVXNlck1vZGVsUHJvbWlzZSxcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGVtYWlsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzdXBwb3J0VGlja2V0TnVtYmVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUeXBlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c3VwcG9ydENvbnRlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1N1cHBvcnRUaWNrZXRPcGVuOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzdXBwb3J0VGlja2V0T3BlbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUaWNrZXRDbG9zZURhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdTdXBwb3J0UmVxdWVzdCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGF3YWl0IFN1cHBvcnRSZXF1ZXN0LnN5bmMoKTtcblx0cmV0dXJuIFN1cHBvcnRSZXF1ZXN0O1xufVxuXG5jb25zdCBTdXBwb3J0UmVxdWVzdE1vZGVsUHJvbWlzZSA9IGluaXRpYWxpemVTdXBwb3J0UmVxdWVzdE1vZGVsKCk7XG5leHBvcnQgZGVmYXVsdCBTdXBwb3J0UmVxdWVzdE1vZGVsUHJvbWlzZTtcbiJdfQ==
