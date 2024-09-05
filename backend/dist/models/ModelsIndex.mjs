import { AppError } from '../config/errorClasses';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
import { loadModels } from './loadModels';
import { environmentVariables } from '../config/environmentConfig';
import { setupLogger } from '../config/logger';
const logger = setupLogger({
	logLevel: environmentVariables.nodeEnv === 'production' ? 'info' : 'debug'
});
let models = null;
let sequelize;
export async function initializeModels(sequelize, logger) {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);
		if (!models) {
			logger.info('Loading models');
			models = await loadModels(sequelize, logger);
			logger.info('Models loaded');
		}
		return models;
	} catch (error) {
		processError(error, logger || console);
		throw new AppError('Internal Server Error', 500);
	}
}
export async function getModels() {
	try {
		if (!models) {
			logger.error('Models have not been initialized');
			try {
				logger.info('Attempting to load models');
				models = await initializeModels(sequelize, logger);
				if (models) {
					logger.info('Models loaded');
					return models;
				}
			} catch (error) {
				processError(error, logger || console);
				throw new AppError('Internal Server Error', 500);
			}
		}
		return models;
	} catch (error) {
		processError(error, logger || console);
		throw new AppError('Internal Server Error', 500);
	}
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWxzSW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbW9kZWxzL01vZGVsc0luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUNyRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFFLFVBQVUsRUFBVSxNQUFNLGNBQWMsQ0FBQztBQUNsRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUNuRSxPQUFPLEVBQVUsV0FBVyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFdkQsTUFBTSxNQUFNLEdBQVcsV0FBVyxDQUFDO0lBQ2xDLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU87Q0FDMUUsQ0FBQyxDQUFDO0FBRUgsSUFBSSxNQUFNLEdBQWtCLElBQUksQ0FBQztBQUVqQyxJQUFJLFNBQW9CLENBQUM7QUFFekIsTUFBTSxDQUFDLEtBQUssVUFBVSxnQkFBZ0IsQ0FDckMsU0FBb0IsRUFDcEIsTUFBYztJQUVkLElBQUksQ0FBQztRQUNKLG9CQUFvQixDQUNuQjtZQUNDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO1lBQzFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO1NBQ3BDLEVBQ0QsTUFBTSxJQUFJLE9BQU8sQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM5QixNQUFNLEdBQUcsTUFBTSxVQUFVLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELE9BQU8sTUFBZ0IsQ0FBQztJQUN6QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQztRQUN2QyxNQUFNLElBQUksUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xELENBQUM7QUFDRixDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxTQUFTO0lBQzlCLElBQUksQ0FBQztRQUNKLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNiLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ25ELElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDN0IsT0FBTyxNQUFNLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxJQUFJLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sTUFBZ0IsQ0FBQztJQUN6QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNoQixZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQztRQUN2QyxNQUFNLElBQUksUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xELENBQUM7QUFDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2VxdWVsaXplIH0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCB7IEFwcEVycm9yIH0gZnJvbSAnLi4vY29uZmlnL2Vycm9yQ2xhc3Nlcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL3ZhbGlkYXRlRGVwZW5kZW5jaWVzJztcbmltcG9ydCB7IHByb2Nlc3NFcnJvciB9IGZyb20gJy4uL3V0aWxzL3Byb2Nlc3NFcnJvcic7XG5pbXBvcnQgeyBsb2FkTW9kZWxzLCBNb2RlbHMgfSBmcm9tICcuL2xvYWRNb2RlbHMnO1xuaW1wb3J0IHsgZW52aXJvbm1lbnRWYXJpYWJsZXMgfSBmcm9tICcuLi9jb25maWcvZW52aXJvbm1lbnRDb25maWcnO1xuaW1wb3J0IHsgTG9nZ2VyLCBzZXR1cExvZ2dlciB9IGZyb20gJy4uL2NvbmZpZy9sb2dnZXInO1xuXG5jb25zdCBsb2dnZXI6IExvZ2dlciA9IHNldHVwTG9nZ2VyKHtcblx0bG9nTGV2ZWw6IGVudmlyb25tZW50VmFyaWFibGVzLm5vZGVFbnYgPT09ICdwcm9kdWN0aW9uJyA/ICdpbmZvJyA6ICdkZWJ1Zydcbn0pO1xuXG5sZXQgbW9kZWxzOiBNb2RlbHMgfCBudWxsID0gbnVsbDtcblxubGV0IHNlcXVlbGl6ZTogU2VxdWVsaXplO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZU1vZGVscyhcblx0c2VxdWVsaXplOiBTZXF1ZWxpemUsXG5cdGxvZ2dlcjogTG9nZ2VyXG4pOiBQcm9taXNlPE1vZGVscz4ge1xuXHR0cnkge1xuXHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFx0W1xuXHRcdFx0XHR7IG5hbWU6ICdzZXF1ZWxpemUnLCBpbnN0YW5jZTogc2VxdWVsaXplIH0sXG5cdFx0XHRcdHsgbmFtZTogJ2xvZ2dlcicsIGluc3RhbmNlOiBsb2dnZXIgfVxuXHRcdFx0XSxcblx0XHRcdGxvZ2dlciB8fCBjb25zb2xlXG5cdFx0KTtcblxuXHRcdGlmICghbW9kZWxzKSB7XG5cdFx0XHRsb2dnZXIuaW5mbygnTG9hZGluZyBtb2RlbHMnKTtcblx0XHRcdG1vZGVscyA9IGF3YWl0IGxvYWRNb2RlbHMoc2VxdWVsaXplLCBsb2dnZXIpO1xuXHRcdFx0bG9nZ2VyLmluZm8oJ01vZGVscyBsb2FkZWQnKTtcblx0XHR9XG5cdFx0cmV0dXJuIG1vZGVscyBhcyBNb2RlbHM7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0cHJvY2Vzc0Vycm9yKGVycm9yLCBsb2dnZXIgfHwgY29uc29sZSk7XG5cdFx0dGhyb3cgbmV3IEFwcEVycm9yKCdJbnRlcm5hbCBTZXJ2ZXIgRXJyb3InLCA1MDApO1xuXHR9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNb2RlbHMoKTogUHJvbWlzZTxNb2RlbHM+IHtcblx0dHJ5IHtcblx0XHRpZiAoIW1vZGVscykge1xuXHRcdFx0bG9nZ2VyLmVycm9yKCdNb2RlbHMgaGF2ZSBub3QgYmVlbiBpbml0aWFsaXplZCcpO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bG9nZ2VyLmluZm8oJ0F0dGVtcHRpbmcgdG8gbG9hZCBtb2RlbHMnKTtcblx0XHRcdFx0bW9kZWxzID0gYXdhaXQgaW5pdGlhbGl6ZU1vZGVscyhzZXF1ZWxpemUsIGxvZ2dlcik7XG5cdFx0XHRcdGlmIChtb2RlbHMpIHtcblx0XHRcdFx0XHRsb2dnZXIuaW5mbygnTW9kZWxzIGxvYWRlZCcpO1xuXHRcdFx0XHRcdHJldHVybiBtb2RlbHM7XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHByb2Nlc3NFcnJvcihlcnJvciwgbG9nZ2VyIHx8IGNvbnNvbGUpO1xuXHRcdFx0XHR0aHJvdyBuZXcgQXBwRXJyb3IoJ0ludGVybmFsIFNlcnZlciBFcnJvcicsIDUwMCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBtb2RlbHMgYXMgTW9kZWxzO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHByb2Nlc3NFcnJvcihlcnJvciwgbG9nZ2VyIHx8IGNvbnNvbGUpO1xuXHRcdHRocm93IG5ldyBBcHBFcnJvcignSW50ZXJuYWwgU2VydmVyIEVycm9yJywgNTAwKTtcblx0fVxufVxuIl19
