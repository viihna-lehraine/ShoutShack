import { DataTypes, Model } from 'sequelize';
import { ServiceFactory } from '../index/factory.mjs';
export class ErrorLog extends Model {
	id;
	name;
	message;
	statusCode;
	severity;
	errorCode;
	details;
	timestamp;
	count;
}
export async function createErrorLogModel() {
	const logger = await ServiceFactory.getLoggerService();
	const errorLogger = await ServiceFactory.getErrorLoggerService();
	const errorHandler = await ServiceFactory.getErrorHandlerService();
	try {
		const databaseController = await ServiceFactory.getDatabaseController();
		const sequelize = databaseController.getSequelizeInstance();
		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					'Failed to initialize ErrorLog model: Sequelize instance not found',
					{ exposeToClient: false }
				);
			errorLogger.logError(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			return null;
		}
		ErrorLog.init(
			{
				id: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					primaryKey: true,
					unique: true
				},
				name: {
					type: DataTypes.STRING,
					allowNull: false
				},
				message: {
					type: DataTypes.TEXT,
					allowNull: false
				},
				statusCode: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				severity: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [['info', 'recoverable', 'warning', 'fatal']]
					}
				},
				errorCode: {
					type: DataTypes.STRING,
					allowNull: true
				},
				details: {
					type: DataTypes.JSONB,
					allowNull: true
				},
				timestamp: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW
				},
				count: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0
				}
			},
			{
				sequelize,
				modelName: 'ErrorLog',
				tableName: 'error_logs',
				timestamps: false
			}
		);
		logger.info('ErrorLog model initialized successfully');
		return ErrorLog;
	} catch (loadModelError) {
		const loadErrorLogModelError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize ErrorLog model: ${loadModelError instanceof Error ? loadModelError.message : 'Unknown error'}`,
				{
					exposeToClient: false
				}
			);
		errorLogger.logError(loadErrorLogModelError.message);
		errorHandler.handleError({ error: loadErrorLogModelError });
		return null;
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXJyb3JMb2cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbW9kZWxzL0Vycm9yTG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFFTixTQUFTLEVBR1QsS0FBSyxFQUNMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUdsRCxNQUFNLE9BQU8sUUFDWixTQUFRLEtBQW1FO0lBR3BFLEVBQUUsQ0FBNEI7SUFDOUIsSUFBSSxDQUFVO0lBQ2QsT0FBTyxDQUFVO0lBQ2pCLFVBQVUsQ0FBaUI7SUFDM0IsUUFBUSxDQUFVO0lBQ2xCLFNBQVMsQ0FBaUI7SUFDMUIsT0FBTyxDQUEyQztJQUNsRCxTQUFTLENBQTBCO0lBQ25DLEtBQUssQ0FBVTtDQUN0QjtBQUVELE1BQU0sQ0FBQyxLQUFLLFVBQVUsbUJBQW1CO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDdkQsTUFBTSxXQUFXLEdBQUcsTUFBTSxjQUFjLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUNqRSxNQUFNLFlBQVksR0FBRyxNQUFNLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0lBRW5FLElBQUksQ0FBQztRQUNKLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxjQUFjLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUN4RSxNQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBRTVELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNoQixNQUFNLGFBQWEsR0FDbEIsSUFBSSxZQUFZLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUNyRCxtRUFBbUUsRUFDbkUsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLENBQ3pCLENBQUM7WUFDSCxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1QyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7WUFDbkQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsUUFBUSxDQUFDLElBQUksQ0FDWjtZQUNDLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsTUFBTSxFQUFFLElBQUk7YUFDWjtZQUNELElBQUksRUFBRTtnQkFDTCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsT0FBTyxFQUFFO2dCQUNSLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxVQUFVLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsUUFBUSxFQUFFO2dCQUNULElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFFBQVEsRUFBRTtvQkFDVCxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUNuRDthQUNEO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELE9BQU8sRUFBRTtnQkFDUixJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUs7Z0JBQ3JCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2FBQzNCO1lBQ0QsS0FBSyxFQUFFO2dCQUNOLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDdkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFlBQVksRUFBRSxDQUFDO2FBQ2Y7U0FDRCxFQUNEO1lBQ0MsU0FBUztZQUNULFNBQVMsRUFBRSxVQUFVO1lBQ3JCLFNBQVMsRUFBRSxZQUFZO1lBQ3ZCLFVBQVUsRUFBRSxLQUFLO1NBQ2pCLENBQ0QsQ0FBQztRQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUMseUNBQXlDLENBQUMsQ0FBQztRQUN2RCxPQUFPLFFBQVEsQ0FBQztJQUNqQixDQUFDO0lBQUMsT0FBTyxjQUFjLEVBQUUsQ0FBQztRQUN6QixNQUFNLHNCQUFzQixHQUMzQixJQUFJLFlBQVksQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQ3JELHdDQUF3QyxjQUFjLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsRUFDcEg7WUFDQyxjQUFjLEVBQUUsS0FBSztTQUNyQixDQUNELENBQUM7UUFDSCxXQUFXLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1FBQzVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztBQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRDcmVhdGlvbk9wdGlvbmFsLFxuXHREYXRhVHlwZXMsXG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsXG5cdE1vZGVsXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgeyBTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL2luZGV4L2ZhY3RvcnknO1xuaW1wb3J0IHsgRXJyb3JMb2dBdHRyaWJ1dGVzIH0gZnJvbSAnLi4vaW5kZXgvaW50ZXJmYWNlcy9tb2RlbHMnO1xuXG5leHBvcnQgY2xhc3MgRXJyb3JMb2dcblx0ZXh0ZW5kcyBNb2RlbDxJbmZlckF0dHJpYnV0ZXM8RXJyb3JMb2c+LCBJbmZlckNyZWF0aW9uQXR0cmlidXRlczxFcnJvckxvZz4+XG5cdGltcGxlbWVudHMgRXJyb3JMb2dBdHRyaWJ1dGVzXG57XG5cdHB1YmxpYyBpZCE6IENyZWF0aW9uT3B0aW9uYWw8bnVtYmVyPjtcblx0cHVibGljIG5hbWUhOiBzdHJpbmc7XG5cdHB1YmxpYyBtZXNzYWdlITogc3RyaW5nO1xuXHRwdWJsaWMgc3RhdHVzQ29kZSE6IG51bWJlciB8IG51bGw7XG5cdHB1YmxpYyBzZXZlcml0eSE6IHN0cmluZztcblx0cHVibGljIGVycm9yQ29kZSE6IHN0cmluZyB8IG51bGw7XG5cdHB1YmxpYyBkZXRhaWxzITogc3RyaW5nIHwgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsO1xuXHRwdWJsaWMgdGltZXN0YW1wITogQ3JlYXRpb25PcHRpb25hbDxEYXRlPjtcblx0cHVibGljIGNvdW50ITogbnVtYmVyO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlRXJyb3JMb2dNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBFcnJvckxvZyB8IG51bGw+IHtcblx0Y29uc3QgbG9nZ2VyID0gYXdhaXQgU2VydmljZUZhY3RvcnkuZ2V0TG9nZ2VyU2VydmljZSgpO1xuXHRjb25zdCBlcnJvckxvZ2dlciA9IGF3YWl0IFNlcnZpY2VGYWN0b3J5LmdldEVycm9yTG9nZ2VyU2VydmljZSgpO1xuXHRjb25zdCBlcnJvckhhbmRsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXRFcnJvckhhbmRsZXJTZXJ2aWNlKCk7XG5cblx0dHJ5IHtcblx0XHRjb25zdCBkYXRhYmFzZUNvbnRyb2xsZXIgPSBhd2FpdCBTZXJ2aWNlRmFjdG9yeS5nZXREYXRhYmFzZUNvbnRyb2xsZXIoKTtcblx0XHRjb25zdCBzZXF1ZWxpemUgPSBkYXRhYmFzZUNvbnRyb2xsZXIuZ2V0U2VxdWVsaXplSW5zdGFuY2UoKTtcblxuXHRcdGlmICghc2VxdWVsaXplKSB7XG5cdFx0XHRjb25zdCBkYXRhYmFzZUVycm9yID1cblx0XHRcdFx0bmV3IGVycm9ySGFuZGxlci5FcnJvckNsYXNzZXMuRGF0YWJhc2VFcnJvclJlY292ZXJhYmxlKFxuXHRcdFx0XHRcdCdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBFcnJvckxvZyBtb2RlbDogU2VxdWVsaXplIGluc3RhbmNlIG5vdCBmb3VuZCcsXG5cdFx0XHRcdFx0eyBleHBvc2VUb0NsaWVudDogZmFsc2UgfVxuXHRcdFx0XHQpO1xuXHRcdFx0ZXJyb3JMb2dnZXIubG9nRXJyb3IoZGF0YWJhc2VFcnJvci5tZXNzYWdlKTtcblx0XHRcdGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yOiBkYXRhYmFzZUVycm9yIH0pO1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXG5cdFx0RXJyb3JMb2cuaW5pdChcblx0XHRcdHtcblx0XHRcdFx0aWQ6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG5hbWU6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0bWVzc2FnZToge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0c3RhdHVzQ29kZToge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzZXZlcml0eToge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdFx0aXNJbjogW1snaW5mbycsICdyZWNvdmVyYWJsZScsICd3YXJuaW5nJywgJ2ZhdGFsJ11dXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRlcnJvckNvZGU6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkZXRhaWxzOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkpTT05CLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0aW1lc3RhbXA6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PV1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb3VudDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiAwXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdFx0bW9kZWxOYW1lOiAnRXJyb3JMb2cnLFxuXHRcdFx0XHR0YWJsZU5hbWU6ICdlcnJvcl9sb2dzJyxcblx0XHRcdFx0dGltZXN0YW1wczogZmFsc2Vcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0bG9nZ2VyLmluZm8oJ0Vycm9yTG9nIG1vZGVsIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseScpO1xuXHRcdHJldHVybiBFcnJvckxvZztcblx0fSBjYXRjaCAobG9hZE1vZGVsRXJyb3IpIHtcblx0XHRjb25zdCBsb2FkRXJyb3JMb2dNb2RlbEVycm9yID1cblx0XHRcdG5ldyBlcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkRhdGFiYXNlRXJyb3JSZWNvdmVyYWJsZShcblx0XHRcdFx0YEZhaWxlZCB0byBpbml0aWFsaXplIEVycm9yTG9nIG1vZGVsOiAke2xvYWRNb2RlbEVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBsb2FkTW9kZWxFcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWAsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRleHBvc2VUb0NsaWVudDogZmFsc2Vcblx0XHRcdFx0fVxuXHRcdFx0KTtcblx0XHRlcnJvckxvZ2dlci5sb2dFcnJvcihsb2FkRXJyb3JMb2dNb2RlbEVycm9yLm1lc3NhZ2UpO1xuXHRcdGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcih7IGVycm9yOiBsb2FkRXJyb3JMb2dNb2RlbEVycm9yIH0pO1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG59XG4iXX0=
