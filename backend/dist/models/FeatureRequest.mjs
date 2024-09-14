import { DataTypes, Model } from 'sequelize';
import { processError } from '../utils/processError.mjs';
import { validateDependencies } from '../utils/validateDependencies.mjs';
class FeatureRequest extends Model {
	featureRequestNumber;
	id;
	email;
	featureRequestType;
	featureRequestContent;
	canFollowUpFeatureRequest;
	featureRequestOpenDate;
	featureRequestCloseDate;
}
export default function createFeatureRequestModel(sequelize, logger) {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);
		FeatureRequest.init(
			{
				featureRequestNumber: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
					autoIncrement: true
				},
				id: {
					type: DataTypes.STRING,
					allowNull: true
				},
				email: {
					type: DataTypes.STRING,
					allowNull: true
				},
				featureRequestType: {
					type: DataTypes.STRING,
					allowNull: false
				},
				featureRequestContent: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				canFollowUpFeatureRequest: {
					type: DataTypes.BOOLEAN,
					allowNull: false
				},
				featureRequestOpenDate: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW
				},
				featureRequestCloseDate: {
					type: DataTypes.DATE,
					allowNull: true
				}
			},
			{
				sequelize,
				tableName: 'FeatureRequests',
				timestamps: true
			}
		);
		logger.info('FeatureRequest model initialized successfully');
		return FeatureRequest;
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}
export { FeatureRequest };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmVhdHVyZVJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbW9kZWxzL0ZlYXR1cmVSZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUtMLE1BQU0sV0FBVyxDQUFDO0FBRW5CLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQWFyRSxNQUFNLGNBQ0wsU0FBUSxLQUdQO0lBR00sb0JBQW9CLENBQVU7SUFDOUIsRUFBRSxDQUFVO0lBQ1osS0FBSyxDQUFpQjtJQUN0QixrQkFBa0IsQ0FBVTtJQUM1QixxQkFBcUIsQ0FBVTtJQUMvQix5QkFBeUIsQ0FBVztJQUNwQyxzQkFBc0IsQ0FBMEI7SUFDaEQsdUJBQXVCLENBQWU7Q0FDN0M7QUFFRCxNQUFNLENBQUMsT0FBTyxVQUFVLHlCQUF5QixDQUNoRCxTQUFvQixFQUNwQixNQUFjO0lBRWQsSUFBSSxDQUFDO1FBQ0osb0JBQW9CLENBQ25CO1lBQ0MsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7WUFDMUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUU7U0FDcEMsRUFDRCxNQUFNLElBQUksT0FBTyxDQUNqQixDQUFDO1FBRUYsY0FBYyxDQUFDLElBQUksQ0FDbEI7WUFDQyxvQkFBb0IsRUFBRTtnQkFDckIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixTQUFTLEVBQUUsS0FBSztnQkFDaEIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLGFBQWEsRUFBRSxJQUFJO2FBQ25CO1lBQ0QsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxrQkFBa0IsRUFBRTtnQkFDbkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELHFCQUFxQixFQUFFO2dCQUN0QixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QseUJBQXlCLEVBQUU7Z0JBQzFCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxzQkFBc0IsRUFBRTtnQkFDdkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2FBQzNCO1lBQ0QsdUJBQXVCLEVBQUU7Z0JBQ3hCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLElBQUk7YUFDZjtTQUNELEVBQ0Q7WUFDQyxTQUFTO1lBQ1QsU0FBUyxFQUFFLGlCQUFpQjtZQUM1QixVQUFVLEVBQUUsSUFBSTtTQUNoQixDQUNELENBQUM7UUFFRixNQUFNLENBQUMsSUFBSSxDQUFDLCtDQUErQyxDQUFDLENBQUM7UUFDN0QsT0FBTyxjQUFjLENBQUM7SUFDdkIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDaEIsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxLQUFLLENBQUM7SUFDYixDQUFDO0FBQ0YsQ0FBQztBQUVELE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdERhdGFUeXBlcyxcblx0TW9kZWwsXG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsXG5cdENyZWF0aW9uT3B0aW9uYWwsXG5cdFNlcXVlbGl6ZVxufSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vY29uZmlnL2xvZ2dlcic7XG5pbXBvcnQgeyBwcm9jZXNzRXJyb3IgfSBmcm9tICcuLi91dGlscy9wcm9jZXNzRXJyb3InO1xuaW1wb3J0IHsgdmFsaWRhdGVEZXBlbmRlbmNpZXMgfSBmcm9tICcuLi91dGlscy92YWxpZGF0ZURlcGVuZGVuY2llcyc7XG5cbmludGVyZmFjZSBGZWF0dXJlUmVxdWVzdEF0dHJpYnV0ZXMge1xuXHRmZWF0dXJlUmVxdWVzdE51bWJlcjogbnVtYmVyO1xuXHRpZDogc3RyaW5nO1xuXHRlbWFpbD86IHN0cmluZyB8IG51bGw7XG5cdGZlYXR1cmVSZXF1ZXN0VHlwZTogc3RyaW5nO1xuXHRmZWF0dXJlUmVxdWVzdENvbnRlbnQ6IHN0cmluZztcblx0Y2FuRm9sbG93VXBGZWF0dXJlUmVxdWVzdDogYm9vbGVhbjtcblx0ZmVhdHVyZVJlcXVlc3RPcGVuRGF0ZTogRGF0ZTtcblx0ZmVhdHVyZVJlcXVlc3RDbG9zZURhdGU/OiBEYXRlIHwgbnVsbDtcbn1cblxuY2xhc3MgRmVhdHVyZVJlcXVlc3Rcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8RmVhdHVyZVJlcXVlc3Q+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPEZlYXR1cmVSZXF1ZXN0PlxuXHQ+XG5cdGltcGxlbWVudHMgRmVhdHVyZVJlcXVlc3RBdHRyaWJ1dGVzXG57XG5cdHB1YmxpYyBmZWF0dXJlUmVxdWVzdE51bWJlciE6IG51bWJlcjtcblx0cHVibGljIGlkITogc3RyaW5nO1xuXHRwdWJsaWMgZW1haWwhOiBzdHJpbmcgfCBudWxsO1xuXHRwdWJsaWMgZmVhdHVyZVJlcXVlc3RUeXBlITogc3RyaW5nO1xuXHRwdWJsaWMgZmVhdHVyZVJlcXVlc3RDb250ZW50ITogc3RyaW5nO1xuXHRwdWJsaWMgY2FuRm9sbG93VXBGZWF0dXJlUmVxdWVzdCE6IGJvb2xlYW47XG5cdHB1YmxpYyBmZWF0dXJlUmVxdWVzdE9wZW5EYXRlITogQ3JlYXRpb25PcHRpb25hbDxEYXRlPjtcblx0cHVibGljIGZlYXR1cmVSZXF1ZXN0Q2xvc2VEYXRlITogRGF0ZSB8IG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUZlYXR1cmVSZXF1ZXN0TW9kZWwoXG5cdHNlcXVlbGl6ZTogU2VxdWVsaXplLFxuXHRsb2dnZXI6IExvZ2dlclxuKTogdHlwZW9mIEZlYXR1cmVSZXF1ZXN0IHtcblx0dHJ5IHtcblx0XHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRcdFtcblx0XHRcdFx0eyBuYW1lOiAnc2VxdWVsaXplJywgaW5zdGFuY2U6IHNlcXVlbGl6ZSB9LFxuXHRcdFx0XHR7IG5hbWU6ICdsb2dnZXInLCBpbnN0YW5jZTogbG9nZ2VyIH1cblx0XHRcdF0sXG5cdFx0XHRsb2dnZXIgfHwgY29uc29sZVxuXHRcdCk7XG5cblx0XHRGZWF0dXJlUmVxdWVzdC5pbml0KFxuXHRcdFx0e1xuXHRcdFx0XHRmZWF0dXJlUmVxdWVzdE51bWJlcjoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGlkOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0ZW1haWw6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmZWF0dXJlUmVxdWVzdFR5cGU6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0ZmVhdHVyZVJlcXVlc3RDb250ZW50OiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjYW5Gb2xsb3dVcEZlYXR1cmVSZXF1ZXN0OiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmZWF0dXJlUmVxdWVzdE9wZW5EYXRlOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1dcblx0XHRcdFx0fSxcblx0XHRcdFx0ZmVhdHVyZVJlcXVlc3RDbG9zZURhdGU6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0XHR0YWJsZU5hbWU6ICdGZWF0dXJlUmVxdWVzdHMnLFxuXHRcdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdGxvZ2dlci5pbmZvKCdGZWF0dXJlUmVxdWVzdCBtb2RlbCBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHknKTtcblx0XHRyZXR1cm4gRmVhdHVyZVJlcXVlc3Q7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0cHJvY2Vzc0Vycm9yKGVycm9yLCBsb2dnZXIgfHwgY29uc29sZSk7XG5cdFx0dGhyb3cgZXJyb3I7XG5cdH1cbn1cblxuZXhwb3J0IHsgRmVhdHVyZVJlcXVlc3QgfTtcbiJdfQ==
