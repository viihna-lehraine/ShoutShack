import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db';
import UserModelPromise from './User';
class RecoveryMethod extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isRecoveryActive', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'recoveryId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'recoveryMethod', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'backupCodes', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'recoveryLastUpdated', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
function initializeRecoveryMethodModel() {
	return __awaiter(this, void 0, void 0, function* () {
		const sequelize = yield initializeDatabase();
		RecoveryMethod.init(
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
				isRecoveryActive: {
					type: DataTypes.BOOLEAN,
					defaultValue: false,
					allowNull: false
				},
				recoveryId: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true
				},
				recoveryMethod: {
					type: DataTypes.ENUM('email', 'backupCodes'),
					allowNull: true
				},
				backupCodes: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: true
				},
				recoveryLastUpdated: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'RecoveryMethod',
				timestamps: true
			}
		);
		yield RecoveryMethod.sync();
		return RecoveryMethod;
	});
}
const RecoveryMethodModelPromise = initializeRecoveryMethodModel();
export default RecoveryMethodModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVjb3ZlcnlNZXRob2QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvUmVjb3ZlcnlNZXRob2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUdMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBV3RDLE1BQU0sY0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUEyQjtRQUMzQjs7Ozs7V0FBb0I7UUFDcEI7Ozs7O1dBQXlDO1FBQ3pDOzs7OztXQUE4QjtRQUM5Qjs7Ozs7V0FBMkI7SUFDNUIsQ0FBQztDQUFBO0FBRUQsU0FBZSw2QkFBNkI7O1FBQzNDLE1BQU0sU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxjQUFjLENBQUMsSUFBSSxDQUNsQjtZQUNDLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO29CQUM3QixHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2pCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsVUFBVSxFQUFFO2dCQUNYLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2FBQ1o7WUFDRCxjQUFjLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQztnQkFDNUMsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELFdBQVcsRUFBRTtnQkFDWixJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO2dCQUN2QyxTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsbUJBQW1CLEVBQUU7Z0JBQ3BCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2dCQUMzQixTQUFTLEVBQUUsSUFBSTthQUNmO1NBQ0QsRUFDRDtZQUNDLFNBQVM7WUFDVCxTQUFTLEVBQUUsZ0JBQWdCO1lBQzNCLFVBQVUsRUFBRSxJQUFJO1NBQ2hCLENBQ0QsQ0FBQztRQUVGLE1BQU0sY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7Q0FBQTtBQUVELE1BQU0sMEJBQTBCLEdBQUcsNkJBQTZCLEVBQUUsQ0FBQztBQUNuRSxlQUFlLDBCQUEwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0RGF0YVR5cGVzLFxuXHRNb2RlbCxcblx0SW5mZXJBdHRyaWJ1dGVzLFxuXHRJbmZlckNyZWF0aW9uQXR0cmlidXRlc1xufSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IGluaXRpYWxpemVEYXRhYmFzZSBmcm9tICcuLi9jb25maWcvZGInO1xuaW1wb3J0IFVzZXJNb2RlbFByb21pc2UgZnJvbSAnLi9Vc2VyJztcblxuaW50ZXJmYWNlIFJlY292ZXJ5TWV0aG9kQXR0cmlidXRlcyB7XG5cdGlkOiBzdHJpbmc7XG5cdGlzUmVjb3ZlcnlBY3RpdmU6IGJvb2xlYW47XG5cdHJlY292ZXJ5SWQ6IHN0cmluZztcblx0cmVjb3ZlcnlNZXRob2Q6ICdlbWFpbCcgfCAnYmFja3VwQ29kZXMnO1xuXHRiYWNrdXBDb2Rlcz86IHN0cmluZ1tdIHwgbnVsbDtcblx0cmVjb3ZlcnlMYXN0VXBkYXRlZDogRGF0ZTtcbn1cblxuY2xhc3MgUmVjb3ZlcnlNZXRob2Rcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8UmVjb3ZlcnlNZXRob2Q+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPFJlY292ZXJ5TWV0aG9kPlxuXHQ+XG5cdGltcGxlbWVudHMgUmVjb3ZlcnlNZXRob2RBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRpc1JlY292ZXJ5QWN0aXZlITogYm9vbGVhbjtcblx0cmVjb3ZlcnlJZCE6IHN0cmluZztcblx0cmVjb3ZlcnlNZXRob2QhOiAnZW1haWwnIHwgJ2JhY2t1cENvZGVzJztcblx0YmFja3VwQ29kZXMhOiBzdHJpbmdbXSB8IG51bGw7XG5cdHJlY292ZXJ5TGFzdFVwZGF0ZWQhOiBEYXRlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplUmVjb3ZlcnlNZXRob2RNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBSZWNvdmVyeU1ldGhvZD4ge1xuXHRjb25zdCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblxuXHRSZWNvdmVyeU1ldGhvZC5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBhd2FpdCBVc2VyTW9kZWxQcm9taXNlLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0aXNSZWNvdmVyeUFjdGl2ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHJlY292ZXJ5SWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cmVjb3ZlcnlNZXRob2Q6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkVOVU0oJ2VtYWlsJywgJ2JhY2t1cENvZGVzJyksXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGJhY2t1cENvZGVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5BUlJBWShEYXRhVHlwZXMuU1RSSU5HKSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cmVjb3ZlcnlMYXN0VXBkYXRlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ1JlY292ZXJ5TWV0aG9kJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0YXdhaXQgUmVjb3ZlcnlNZXRob2Quc3luYygpO1xuXHRyZXR1cm4gUmVjb3ZlcnlNZXRob2Q7XG59XG5cbmNvbnN0IFJlY292ZXJ5TWV0aG9kTW9kZWxQcm9taXNlID0gaW5pdGlhbGl6ZVJlY292ZXJ5TWV0aG9kTW9kZWwoKTtcbmV4cG9ydCBkZWZhdWx0IFJlY292ZXJ5TWV0aG9kTW9kZWxQcm9taXNlO1xuIl19
