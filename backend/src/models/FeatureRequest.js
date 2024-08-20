import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';
class FeatureRequest extends Model {
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
		Object.defineProperty(this, 'featureRequestNumber', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'featureRequestType', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'featureRequestContent', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'canFollowUpFeatureRequest', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'featureRequestOpenDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'featureRequestCloseDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
function initializeFeatureRequestModel() {
	return __awaiter(this, void 0, void 0, function* () {
		const sequelize = yield initializeDatabase();
		FeatureRequest.init(
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
					allowNull: true,
					defaultValue: null
				},
				featureRequestNumber: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: true,
					unique: true
				},
				featureRequestType: {
					type: DataTypes.TEXT,
					allowNull: false,
					defaultValue: null
				},
				featureRequestContent: {
					type: DataTypes.TEXT,
					allowNull: false,
					defaultValue: null
				},
				canFollowUpFeatureRequest: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				featureRequestOpenDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				featureRequestCloseDate: {
					type: DataTypes.DATE,
					allowNull: true,
					defaultValue: null
				}
			},
			{
				sequelize,
				modelName: 'FeatureRequest',
				timestamps: true
			}
		);
		yield FeatureRequest.sync();
		return FeatureRequest;
	});
}
// Export the initialized model
const FeatureRequestModelPromise = initializeFeatureRequestModel();
export default FeatureRequestModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmVhdHVyZVJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvRmVhdHVyZVJlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBR1QsS0FBSyxFQUVMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBYXRDLE1BQU0sY0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUFzQjtRQUN0Qjs7Ozs7V0FBOEI7UUFDOUI7Ozs7O1dBQTRCO1FBQzVCOzs7OztXQUErQjtRQUMvQjs7Ozs7V0FBb0M7UUFDcEM7Ozs7O1dBQWdEO1FBQ2hEOzs7OztXQUFzQztJQUN2QyxDQUFDO0NBQUE7QUFFRCxTQUFlLDZCQUE2Qjs7UUFDM0MsTUFBTSxTQUFTLEdBQUcsTUFBTSxrQkFBa0IsRUFBRSxDQUFDO1FBRTdDLGNBQWMsQ0FBQyxJQUFJLENBQ2xCO1lBQ0MsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRTtvQkFDWCxLQUFLLEVBQUUsTUFBTSxnQkFBZ0I7b0JBQzdCLEdBQUcsRUFBRSxJQUFJO2lCQUNUO2FBQ0Q7WUFDRCxLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsSUFBSTtnQkFDZixZQUFZLEVBQUUsSUFBSTthQUNsQjtZQUNELG9CQUFvQixFQUFFO2dCQUNyQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixTQUFTLEVBQUUsSUFBSTtnQkFDZixNQUFNLEVBQUUsSUFBSTthQUNaO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ25CLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxJQUFJO2FBQ2xCO1lBQ0QscUJBQXFCLEVBQUU7Z0JBQ3RCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxJQUFJO2FBQ2xCO1lBQ0QseUJBQXlCLEVBQUU7Z0JBQzFCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0Qsc0JBQXNCLEVBQUU7Z0JBQ3ZCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2dCQUMzQixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELHVCQUF1QixFQUFFO2dCQUN4QixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFlBQVksRUFBRSxJQUFJO2FBQ2xCO1NBQ0QsRUFDRDtZQUNDLFNBQVM7WUFDVCxTQUFTLEVBQUUsZ0JBQWdCO1lBQzNCLFVBQVUsRUFBRSxJQUFJO1NBQ2hCLENBQ0QsQ0FBQztRQUVGLE1BQU0sY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7Q0FBQTtBQUVELCtCQUErQjtBQUMvQixNQUFNLDBCQUEwQixHQUFHLDZCQUE2QixFQUFFLENBQUM7QUFDbkUsZUFBZSwwQkFBMEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdERhdGFUeXBlcyxcblx0SW5mZXJBdHRyaWJ1dGVzLFxuXHRJbmZlckNyZWF0aW9uQXR0cmlidXRlcyxcblx0TW9kZWwsXG5cdENyZWF0aW9uT3B0aW9uYWxcbn0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCBpbml0aWFsaXplRGF0YWJhc2UgZnJvbSAnLi4vY29uZmlnL2RiJztcbmltcG9ydCBVc2VyTW9kZWxQcm9taXNlIGZyb20gJy4vVXNlcic7XG5cbmludGVyZmFjZSBGZWF0dXJlUmVxdWVzdEF0dHJpYnV0ZXMge1xuXHRpZDogc3RyaW5nO1xuXHRlbWFpbD86IHN0cmluZyB8IG51bGw7XG5cdGZlYXR1cmVSZXF1ZXN0TnVtYmVyOiBudW1iZXI7XG5cdGZlYXR1cmVSZXF1ZXN0VHlwZTogc3RyaW5nO1xuXHRmZWF0dXJlUmVxdWVzdENvbnRlbnQ6IHN0cmluZztcblx0Y2FuRm9sbG93VXBGZWF0dXJlUmVxdWVzdDogYm9vbGVhbjtcblx0ZmVhdHVyZVJlcXVlc3RPcGVuRGF0ZTogRGF0ZTtcblx0ZmVhdHVyZVJlcXVlc3RDbG9zZURhdGU/OiBEYXRlIHwgbnVsbDtcbn1cblxuY2xhc3MgRmVhdHVyZVJlcXVlc3Rcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8RmVhdHVyZVJlcXVlc3Q+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPEZlYXR1cmVSZXF1ZXN0PlxuXHQ+XG5cdGltcGxlbWVudHMgRmVhdHVyZVJlcXVlc3RBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRlbWFpbCE6IHN0cmluZyB8IG51bGw7XG5cdGZlYXR1cmVSZXF1ZXN0TnVtYmVyITogbnVtYmVyO1xuXHRmZWF0dXJlUmVxdWVzdFR5cGUhOiBzdHJpbmc7XG5cdGZlYXR1cmVSZXF1ZXN0Q29udGVudCE6IHN0cmluZztcblx0Y2FuRm9sbG93VXBGZWF0dXJlUmVxdWVzdCE6IGJvb2xlYW47XG5cdGZlYXR1cmVSZXF1ZXN0T3BlbkRhdGUhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHRmZWF0dXJlUmVxdWVzdENsb3NlRGF0ZSE6IERhdGUgfCBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplRmVhdHVyZVJlcXVlc3RNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBGZWF0dXJlUmVxdWVzdD4ge1xuXHRjb25zdCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblxuXHRGZWF0dXJlUmVxdWVzdC5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBhd2FpdCBVc2VyTW9kZWxQcm9taXNlLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZW1haWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGxcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlUmVxdWVzdE51bWJlcjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlUmVxdWVzdFR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbFxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0Q29udGVudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsXG5cdFx0XHR9LFxuXHRcdFx0Y2FuRm9sbG93VXBGZWF0dXJlUmVxdWVzdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0T3BlbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0Q2xvc2VEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnRmVhdHVyZVJlcXVlc3QnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRhd2FpdCBGZWF0dXJlUmVxdWVzdC5zeW5jKCk7XG5cdHJldHVybiBGZWF0dXJlUmVxdWVzdDtcbn1cblxuLy8gRXhwb3J0IHRoZSBpbml0aWFsaXplZCBtb2RlbFxuY29uc3QgRmVhdHVyZVJlcXVlc3RNb2RlbFByb21pc2UgPSBpbml0aWFsaXplRmVhdHVyZVJlcXVlc3RNb2RlbCgpO1xuZXhwb3J0IGRlZmF1bHQgRmVhdHVyZVJlcXVlc3RNb2RlbFByb21pc2U7XG4iXX0=
