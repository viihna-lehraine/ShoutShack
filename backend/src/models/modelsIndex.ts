import { Sequelize } from 'sequelize';
import { loadModels, Models } from './loadModels';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

const logger = ServiceFactory.getLoggerService();
const errorLogger = ServiceFactory.getErrorLoggerService();
const errorHandler = ServiceFactory.getErrorHandlerService();

let models: Models | null = null;
let sequelize: Sequelize;

export async function initializeModels(sequelize: Sequelize): Promise<Models> {
	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger
		);

		logger.info('Initializing and loading models');

		if (!models) {
			models = await loadModels(sequelize);
			logger.info('Models loaded');
		} else {
			logger.info('Models loaded');
		}

		return models as Models;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Error occurred while attempting to initialize model files using initializeModels(): ${dbError instanceof Error ? dbError.message : dbError}`,
				{ exposeToClient: false }
			);
		errorLogger.logInfo(databaseError.message);
		errorHandler.handleError({
			error: databaseError || dbError || Error || 'Unknown error'
		});

		logger.debug('Returning empty object in lieu of models');

		return {} as Models;
	}
}

export async function getModels(): Promise<Models> {
	try {
		if (!models) {
			logger.error('Models have not been initialized');
			try {
				logger.info('Attempting to load models');
				models = await initializeModels(sequelize);
				if (models) {
					logger.info('Models loaded');
					return models;
				}
			} catch (dbError) {
				const databaseError =
					new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Error occurred within getModels() - models were uninitialized when function was called and getModels() failed to initialize them: ${dbError instanceof Error ? dbError.message : dbError}`,
						{ exposeToClient: false }
					);
				errorLogger.logInfo(databaseError.message);
				errorHandler.handleError({
					error: databaseError || dbError || Error || 'Unknown error'
				});
				logger.debug('Returning empty object in lieu of models');

				return {} as Models;
			}
		}
		return models as Models;
	} catch (dbError) {
		const databaseError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Error occurred while attempting to retrieve models using getModels(): ${dbError instanceof Error ? dbError.message : dbError}`,
				{ exposeToClient: false }
			);
		errorLogger.logInfo(databaseError.message);
		errorHandler.handleError({
			error: databaseError || dbError || Error || 'Unknown error'
		});

		logger.debug('Returning empty object in lieu of models');
		return {} as Models;
	}
}
