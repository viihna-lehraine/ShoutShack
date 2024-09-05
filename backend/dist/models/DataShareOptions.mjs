import { DataTypes, Model } from 'sequelize';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
import { User } from './User';
class DataShareOptions extends Model {
	id;
	trackingPixelOption;
	featureUsageOption;
	pageViewsOption;
	interactionDataOption;
	deviceTypeOption;
	browserInfoOption;
	operatingSystemOption;
	randomAnonSurveyOption;
	lastUpdated;
}
export default function createDataShareOptionsModel(sequelize, logger) {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);
		DataShareOptions.init(
			{
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true,
					references: {
						model: User,
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
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'DataShareOptions',
				timestamps: true
			}
		);
		logger.info('DataShareOptions model initialized successfully');
		return DataShareOptions;
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}
export { DataShareOptions };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVNoYXJlT3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvRGF0YVNoYXJlT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRU4sU0FBUyxFQUdULEtBQUssRUFFTCxNQUFNLFdBQVcsQ0FBQztBQUVuQixPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUNyRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQWU5QixNQUFNLGdCQUNMLFNBQVEsS0FHUDtJQUdNLEVBQUUsQ0FBVTtJQUNaLG1CQUFtQixDQUFXO0lBQzlCLGtCQUFrQixDQUFXO0lBQzdCLGVBQWUsQ0FBVztJQUMxQixxQkFBcUIsQ0FBVztJQUNoQyxnQkFBZ0IsQ0FBVztJQUMzQixpQkFBaUIsQ0FBVztJQUM1QixxQkFBcUIsQ0FBVztJQUNoQyxzQkFBc0IsQ0FBVztJQUNqQyxXQUFXLENBQTBCO0NBQzVDO0FBRUQsTUFBTSxDQUFDLE9BQU8sVUFBVSwyQkFBMkIsQ0FDbEQsU0FBb0IsRUFDcEIsTUFBYztJQUVkLElBQUksQ0FBQztRQUNKLG9CQUFvQixDQUNuQjtZQUNDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO1lBQzFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO1NBQ3BDLEVBQ0QsTUFBTSxJQUFJLE9BQU8sQ0FDakIsQ0FBQztRQUVGLGdCQUFnQixDQUFDLElBQUksQ0FDcEI7WUFDQyxFQUFFLEVBQUU7Z0JBQ0gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQzlCLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsTUFBTSxFQUFFLElBQUk7Z0JBQ1osVUFBVSxFQUFFO29CQUNYLEtBQUssRUFBRSxJQUFJO29CQUNYLEdBQUcsRUFBRSxJQUFJO2lCQUNUO2FBQ0Q7WUFDRCxtQkFBbUIsRUFBRTtnQkFDcEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsWUFBWSxFQUFFLEtBQUs7YUFDbkI7WUFDRCxrQkFBa0IsRUFBRTtnQkFDbkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsWUFBWSxFQUFFLEtBQUs7YUFDbkI7WUFDRCxlQUFlLEVBQUU7Z0JBQ2hCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0QscUJBQXFCLEVBQUU7Z0JBQ3RCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2pCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0QsaUJBQWlCLEVBQUU7Z0JBQ2xCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0QscUJBQXFCLEVBQUU7Z0JBQ3RCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0Qsc0JBQXNCLEVBQUU7Z0JBQ3ZCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxLQUFLO2FBQ25CO1lBQ0QsV0FBVyxFQUFFO2dCQUNaLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2dCQUMzQixTQUFTLEVBQUUsS0FBSzthQUNoQjtTQUNELEVBQ0Q7WUFDQyxTQUFTO1lBQ1QsU0FBUyxFQUFFLGtCQUFrQjtZQUM3QixVQUFVLEVBQUUsSUFBSTtTQUNoQixDQUNELENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDLGlEQUFpRCxDQUFDLENBQUM7UUFDL0QsT0FBTyxnQkFBZ0IsQ0FBQztJQUN6QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQztRQUN2QyxNQUFNLEtBQUssQ0FBQztJQUNiLENBQUM7QUFDRixDQUFDO0FBRUQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRDcmVhdGlvbk9wdGlvbmFsLFxuXHREYXRhVHlwZXMsXG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsXG5cdE1vZGVsLFxuXHRTZXF1ZWxpemVcbn0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL2NvbmZpZy9sb2dnZXInO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy92YWxpZGF0ZURlcGVuZGVuY2llcyc7XG5pbXBvcnQgeyBwcm9jZXNzRXJyb3IgfSBmcm9tICcuLi91dGlscy9wcm9jZXNzRXJyb3InO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gJy4vVXNlcic7XG5cbmludGVyZmFjZSBEYXRhU2hhcmVPcHRpb25zQXR0cmlidXRlcyB7XG5cdGlkOiBzdHJpbmc7XG5cdHRyYWNraW5nUGl4ZWxPcHRpb246IGJvb2xlYW47XG5cdGZlYXR1cmVVc2FnZU9wdGlvbjogYm9vbGVhbjtcblx0cGFnZVZpZXdzT3B0aW9uOiBib29sZWFuO1xuXHRpbnRlcmFjdGlvbkRhdGFPcHRpb246IGJvb2xlYW47XG5cdGRldmljZVR5cGVPcHRpb246IGJvb2xlYW47XG5cdGJyb3dzZXJJbmZvT3B0aW9uOiBib29sZWFuO1xuXHRvcGVyYXRpbmdTeXN0ZW1PcHRpb246IGJvb2xlYW47XG5cdHJhbmRvbUFub25TdXJ2ZXlPcHRpb246IGJvb2xlYW47XG5cdGxhc3RVcGRhdGVkOiBEYXRlO1xufVxuXG5jbGFzcyBEYXRhU2hhcmVPcHRpb25zXG5cdGV4dGVuZHMgTW9kZWw8XG5cdFx0SW5mZXJBdHRyaWJ1dGVzPERhdGFTaGFyZU9wdGlvbnM+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPERhdGFTaGFyZU9wdGlvbnM+XG5cdD5cblx0aW1wbGVtZW50cyBEYXRhU2hhcmVPcHRpb25zQXR0cmlidXRlc1xue1xuXHRwdWJsaWMgaWQhOiBzdHJpbmc7XG5cdHB1YmxpYyB0cmFja2luZ1BpeGVsT3B0aW9uITogYm9vbGVhbjtcblx0cHVibGljIGZlYXR1cmVVc2FnZU9wdGlvbiE6IGJvb2xlYW47XG5cdHB1YmxpYyBwYWdlVmlld3NPcHRpb24hOiBib29sZWFuO1xuXHRwdWJsaWMgaW50ZXJhY3Rpb25EYXRhT3B0aW9uITogYm9vbGVhbjtcblx0cHVibGljIGRldmljZVR5cGVPcHRpb24hOiBib29sZWFuO1xuXHRwdWJsaWMgYnJvd3NlckluZm9PcHRpb24hOiBib29sZWFuO1xuXHRwdWJsaWMgb3BlcmF0aW5nU3lzdGVtT3B0aW9uITogYm9vbGVhbjtcblx0cHVibGljIHJhbmRvbUFub25TdXJ2ZXlPcHRpb24hOiBib29sZWFuO1xuXHRwdWJsaWMgbGFzdFVwZGF0ZWQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVEYXRhU2hhcmVPcHRpb25zTW9kZWwoXG5cdHNlcXVlbGl6ZTogU2VxdWVsaXplLFxuXHRsb2dnZXI6IExvZ2dlclxuKTogdHlwZW9mIERhdGFTaGFyZU9wdGlvbnMge1xuXHR0cnkge1xuXHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFx0W1xuXHRcdFx0XHR7IG5hbWU6ICdzZXF1ZWxpemUnLCBpbnN0YW5jZTogc2VxdWVsaXplIH0sXG5cdFx0XHRcdHsgbmFtZTogJ2xvZ2dlcicsIGluc3RhbmNlOiBsb2dnZXIgfVxuXHRcdFx0XSxcblx0XHRcdGxvZ2dlciB8fCBjb25zb2xlXG5cdFx0KTtcblxuXHRcdERhdGFTaGFyZU9wdGlvbnMuaW5pdChcblx0XHRcdHtcblx0XHRcdFx0aWQ6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0dHJhY2tpbmdQaXhlbE9wdGlvbjoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmZWF0dXJlVXNhZ2VPcHRpb246IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0cGFnZVZpZXdzT3B0aW9uOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGludGVyYWN0aW9uRGF0YU9wdGlvbjoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkZXZpY2VUeXBlT3B0aW9uOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGJyb3dzZXJJbmZvT3B0aW9uOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9wZXJhdGluZ1N5c3RlbU9wdGlvbjoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRyYW5kb21Bbm9uU3VydmV5T3B0aW9uOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGxhc3RVcGRhdGVkOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0XHRtb2RlbE5hbWU6ICdEYXRhU2hhcmVPcHRpb25zJyxcblx0XHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdFx0fVxuXHRcdCk7XG5cblx0XHRsb2dnZXIuaW5mbygnRGF0YVNoYXJlT3B0aW9ucyBtb2RlbCBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHknKTtcblx0XHRyZXR1cm4gRGF0YVNoYXJlT3B0aW9ucztcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRwcm9jZXNzRXJyb3IoZXJyb3IsIGxvZ2dlciB8fCBjb25zb2xlKTtcblx0XHR0aHJvdyBlcnJvcjtcblx0fVxufVxuXG5leHBvcnQgeyBEYXRhU2hhcmVPcHRpb25zIH07XG4iXX0=
