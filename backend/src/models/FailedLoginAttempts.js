import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
class FailedLoginAttempts extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'attemptId', {
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
		Object.defineProperty(this, 'attemptDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isLocked', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
// Initialize the FailedLoginAttempt model
function initializeFailedLoginAttemptsModel() {
	return __awaiter(this, void 0, void 0, function* () {
		let sequelize = yield initializeDatabase();
		FailedLoginAttempts.init(
			{
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true
				},
				attemptId: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: true,
					unique: true
				},
				ipAddress: {
					type: DataTypes.STRING,
					allowNull: false
				},
				userAgent: {
					type: DataTypes.STRING,
					allowNull: false
				},
				attemptDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				isLocked: {
					type: DataTypes.BOOLEAN,
					defaultValue: false
				}
			},
			{
				sequelize,
				modelName: 'FailedLoginAttempts',
				timestamps: true
			}
		);
		yield FailedLoginAttempts.sync();
		return FailedLoginAttempts;
	});
}
// Export the initialized model
const FailedLoginAttemptsModelPromise = initializeFailedLoginAttemptsModel();
export default FailedLoginAttemptsModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFpbGVkTG9naW5BdHRlbXB0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9GYWlsZWRMb2dpbkF0dGVtcHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQ04sU0FBUyxFQUNULEtBQUssRUFHTCxNQUFNLFdBQVcsQ0FBQztBQUNuQixPQUFPLGtCQUFrQixNQUFNLGNBQWMsQ0FBQztBQVc5QyxNQUFNLG1CQUNMLFNBQVEsS0FHUDtJQUpGOztRQU9DOzs7OztXQUFZO1FBQ1o7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBbUI7UUFDbkI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQjtJQUNwQixDQUFDO0NBQUE7QUFFRCwwQ0FBMEM7QUFDMUMsU0FBZSxrQ0FBa0M7O1FBR2hELElBQUksU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUUzQyxtQkFBbUIsQ0FBQyxJQUFJLENBQ3ZCO1lBQ0MsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2FBQ1o7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsTUFBTSxFQUFFLElBQUk7YUFDWjtZQUNELFNBQVMsRUFBRTtnQkFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxXQUFXLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsUUFBUSxFQUFFO2dCQUNULElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsWUFBWSxFQUFFLEtBQUs7YUFDbkI7U0FDRCxFQUNEO1lBQ0MsU0FBUztZQUNULFNBQVMsRUFBRSxxQkFBcUI7WUFDaEMsVUFBVSxFQUFFLElBQUk7U0FDaEIsQ0FDRCxDQUFDO1FBRUYsTUFBTSxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNqQyxPQUFPLG1CQUFtQixDQUFDO0lBQzVCLENBQUM7Q0FBQTtBQUVELCtCQUErQjtBQUMvQixNQUFNLCtCQUErQixHQUFHLGtDQUFrQyxFQUFFLENBQUM7QUFDN0UsZUFBZSwrQkFBK0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdERhdGFUeXBlcyxcblx0TW9kZWwsXG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXNcbn0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCBpbml0aWFsaXplRGF0YWJhc2UgZnJvbSAnLi4vY29uZmlnL2RiJztcblxuaW50ZXJmYWNlIEZhaWxlZExvZ2luQXR0ZW1wdHNBdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZztcblx0YXR0ZW1wdElkOiBzdHJpbmc7XG5cdGlwQWRkcmVzczogc3RyaW5nO1xuXHR1c2VyQWdlbnQ6IHN0cmluZztcblx0YXR0ZW1wdERhdGU6IERhdGU7XG5cdGlzTG9ja2VkOiBib29sZWFuO1xufVxuXG5jbGFzcyBGYWlsZWRMb2dpbkF0dGVtcHRzXG5cdGV4dGVuZHMgTW9kZWw8XG5cdFx0SW5mZXJBdHRyaWJ1dGVzPEZhaWxlZExvZ2luQXR0ZW1wdHM+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPEZhaWxlZExvZ2luQXR0ZW1wdHM+XG5cdD5cblx0aW1wbGVtZW50cyBGYWlsZWRMb2dpbkF0dGVtcHRzQXR0cmlidXRlc1xue1xuXHRpZCE6IHN0cmluZztcblx0YXR0ZW1wdElkITogc3RyaW5nO1xuXHRpcEFkZHJlc3MhOiBzdHJpbmc7XG5cdHVzZXJBZ2VudCE6IHN0cmluZztcblx0YXR0ZW1wdERhdGUhOiBEYXRlO1xuXHRpc0xvY2tlZCE6IGJvb2xlYW47XG59XG5cbi8vIEluaXRpYWxpemUgdGhlIEZhaWxlZExvZ2luQXR0ZW1wdCBtb2RlbFxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZUZhaWxlZExvZ2luQXR0ZW1wdHNNb2RlbCgpOiBQcm9taXNlPFxuXHR0eXBlb2YgRmFpbGVkTG9naW5BdHRlbXB0c1xuPiB7XG5cdGxldCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblxuXHRGYWlsZWRMb2dpbkF0dGVtcHRzLmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YXR0ZW1wdElkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlwQWRkcmVzczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dXNlckFnZW50OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRhdHRlbXB0RGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0aXNMb2NrZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0ZhaWxlZExvZ2luQXR0ZW1wdHMnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRhd2FpdCBGYWlsZWRMb2dpbkF0dGVtcHRzLnN5bmMoKTtcblx0cmV0dXJuIEZhaWxlZExvZ2luQXR0ZW1wdHM7XG59XG5cbi8vIEV4cG9ydCB0aGUgaW5pdGlhbGl6ZWQgbW9kZWxcbmNvbnN0IEZhaWxlZExvZ2luQXR0ZW1wdHNNb2RlbFByb21pc2UgPSBpbml0aWFsaXplRmFpbGVkTG9naW5BdHRlbXB0c01vZGVsKCk7XG5leHBvcnQgZGVmYXVsdCBGYWlsZWRMb2dpbkF0dGVtcHRzTW9kZWxQcm9taXNlO1xuIl19
