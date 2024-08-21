import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import { initializeDatabase } from '../index.js';
import UserModelPromise from './User.js';
class DataShareOptions extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'trackingPixelOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'featureUsageOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'pageViewsOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'interactionDataOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'deviceTypeOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'browserInfoOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'operatingSystemOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'randomAnonSurveyOption', {
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
function initializeDataShareOptionsModel() {
	return __awaiter(this, void 0, void 0, function* () {
		let sequelize = yield initializeDatabase();
		DataShareOptions.init(
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
				trackingPixelOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				featureUsageOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				pageViewsOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				interactionDataOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				deviceTypeOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				browserInfoOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				operatingSystemOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				randomAnonSurveyOption: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				lastUpdated: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'DataShareOptions',
				timestamps: true
			}
		);
		yield DataShareOptions.sync();
		return DataShareOptions;
	});
}
const DataShareOptionsModelPromise = initializeDataShareOptionsModel();
export default DataShareOptionsModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVNoYXJlT3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9EYXRhU2hhcmVPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQ04sU0FBUyxFQUNULEtBQUssRUFJTCxNQUFNLFdBQVcsQ0FBQztBQUNuQixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDOUMsT0FBTyxnQkFBZ0IsTUFBTSxRQUFRLENBQUM7QUFldEMsTUFBTSxnQkFDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUE4QjtRQUM5Qjs7Ozs7V0FBNkI7UUFDN0I7Ozs7O1dBQTBCO1FBQzFCOzs7OztXQUFnQztRQUNoQzs7Ozs7V0FBMkI7UUFDM0I7Ozs7O1dBQTRCO1FBQzVCOzs7OztXQUFnQztRQUNoQzs7Ozs7V0FBaUM7UUFDakM7Ozs7O1dBQXFDO0lBQ3RDLENBQUM7Q0FBQTtBQUVELFNBQWUsK0JBQStCOztRQUc3QyxJQUFJLFNBQVMsR0FBRyxNQUFNLGtCQUFrQixFQUFFLENBQUM7UUFFM0MsZ0JBQWdCLENBQUMsSUFBSSxDQUNwQjtZQUNDLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO29CQUM3QixHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsbUJBQW1CLEVBQUU7Z0JBQ3BCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ25CLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0QsZUFBZSxFQUFFO2dCQUNoQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELHFCQUFxQixFQUFFO2dCQUN0QixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELGdCQUFnQixFQUFFO2dCQUNqQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELGlCQUFpQixFQUFFO2dCQUNsQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELHFCQUFxQixFQUFFO2dCQUN0QixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELHNCQUFzQixFQUFFO2dCQUN2QixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELFdBQVcsRUFBRTtnQkFDWixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztnQkFDM0IsU0FBUyxFQUFFLElBQUk7YUFDZjtTQUNELEVBQ0Q7WUFDQyxTQUFTO1lBQ1QsU0FBUyxFQUFFLGtCQUFrQjtZQUM3QixVQUFVLEVBQUUsSUFBSTtTQUNoQixDQUNELENBQUM7UUFFRixNQUFNLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlCLE9BQU8sZ0JBQWdCLENBQUM7SUFDekIsQ0FBQztDQUFBO0FBRUQsTUFBTSw0QkFBNEIsR0FBRywrQkFBK0IsRUFBRSxDQUFDO0FBQ3ZFLGVBQWUsNEJBQTRCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRDcmVhdGlvbk9wdGlvbmFsXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgeyBpbml0aWFsaXplRGF0YWJhc2UgfSBmcm9tICcuLi9pbmRleCc7XG5pbXBvcnQgVXNlck1vZGVsUHJvbWlzZSBmcm9tICcuL1VzZXInO1xuXG5pbnRlcmZhY2UgRGF0YVNoYXJlT3B0aW9uc0F0dHJpYnV0ZXMge1xuXHRpZDogc3RyaW5nO1xuXHR0cmFja2luZ1BpeGVsT3B0aW9uOiBib29sZWFuO1xuXHRmZWF0dXJlVXNhZ2VPcHRpb246IGJvb2xlYW47XG5cdHBhZ2VWaWV3c09wdGlvbjogYm9vbGVhbjtcblx0aW50ZXJhY3Rpb25EYXRhT3B0aW9uOiBib29sZWFuO1xuXHRkZXZpY2VUeXBlT3B0aW9uOiBib29sZWFuO1xuXHRicm93c2VySW5mb09wdGlvbjogYm9vbGVhbjtcblx0b3BlcmF0aW5nU3lzdGVtT3B0aW9uOiBib29sZWFuO1xuXHRyYW5kb21Bbm9uU3VydmV5T3B0aW9uOiBib29sZWFuO1xuXHRsYXN0VXBkYXRlZDogRGF0ZTtcbn1cblxuY2xhc3MgRGF0YVNoYXJlT3B0aW9uc1xuXHRleHRlbmRzIE1vZGVsPFxuXHRcdEluZmVyQXR0cmlidXRlczxEYXRhU2hhcmVPcHRpb25zPixcblx0XHRJbmZlckNyZWF0aW9uQXR0cmlidXRlczxEYXRhU2hhcmVPcHRpb25zPlxuXHQ+XG5cdGltcGxlbWVudHMgRGF0YVNoYXJlT3B0aW9uc0F0dHJpYnV0ZXNcbntcblx0aWQhOiBzdHJpbmc7XG5cdHRyYWNraW5nUGl4ZWxPcHRpb24hOiBib29sZWFuO1xuXHRmZWF0dXJlVXNhZ2VPcHRpb24hOiBib29sZWFuO1xuXHRwYWdlVmlld3NPcHRpb24hOiBib29sZWFuO1xuXHRpbnRlcmFjdGlvbkRhdGFPcHRpb24hOiBib29sZWFuO1xuXHRkZXZpY2VUeXBlT3B0aW9uITogYm9vbGVhbjtcblx0YnJvd3NlckluZm9PcHRpb24hOiBib29sZWFuO1xuXHRvcGVyYXRpbmdTeXN0ZW1PcHRpb24hOiBib29sZWFuO1xuXHRyYW5kb21Bbm9uU3VydmV5T3B0aW9uITogYm9vbGVhbjtcblx0bGFzdFVwZGF0ZWQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplRGF0YVNoYXJlT3B0aW9uc01vZGVsKCk6IFByb21pc2U8XG5cdHR5cGVvZiBEYXRhU2hhcmVPcHRpb25zXG4+IHtcblx0bGV0IHNlcXVlbGl6ZSA9IGF3YWl0IGluaXRpYWxpemVEYXRhYmFzZSgpO1xuXG5cdERhdGFTaGFyZU9wdGlvbnMuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogYXdhaXQgVXNlck1vZGVsUHJvbWlzZSxcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRyYWNraW5nUGl4ZWxPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlVXNhZ2VPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRwYWdlVmlld3NPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpbnRlcmFjdGlvbkRhdGFPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRkZXZpY2VUeXBlT3B0aW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YnJvd3NlckluZm9PcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRvcGVyYXRpbmdTeXN0ZW1PcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRyYW5kb21Bbm9uU3VydmV5T3B0aW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0bGFzdFVwZGF0ZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdEYXRhU2hhcmVPcHRpb25zJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0YXdhaXQgRGF0YVNoYXJlT3B0aW9ucy5zeW5jKCk7XG5cdHJldHVybiBEYXRhU2hhcmVPcHRpb25zO1xufVxuXG5jb25zdCBEYXRhU2hhcmVPcHRpb25zTW9kZWxQcm9taXNlID0gaW5pdGlhbGl6ZURhdGFTaGFyZU9wdGlvbnNNb2RlbCgpO1xuZXhwb3J0IGRlZmF1bHQgRGF0YVNoYXJlT3B0aW9uc01vZGVsUHJvbWlzZTtcbiJdfQ==
