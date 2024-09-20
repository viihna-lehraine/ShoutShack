import { Sequelize } from 'sequelize';
import { loadModels, Models } from './loadModels';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { logger, Logger } from '../utils/appLogger';
import { validateDependencies } from '../utils/validateDependencies';

let models: Models | null = null;
let sequelize: Sequelize;

export async function initializeModels(
	sequelize: Sequelize,
	appLogger: Logger
): Promise<Models> {
	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			appLogger || console
		);

		appLogger.info('Initializing and loading models');

		if (!models) {
			models = await loadModels(sequelize, logger);
			appLogger.info('Models loaded');
		} else {
			appLogger.info('Models loaded');
		}

		return models as Models;
	} catch (dbError) {
		const databaseError = new errorClasses.DatabaseErrorRecoverable(
			`Error occurred while attempting to initialize model files using initializeModels(): ${dbError instanceof Error ? dbError.message : dbError}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(databaseError.message, logger);
		processError(databaseError, logger);

		appLogger.debug('Returning empty object in lieu of models');

		return {} as Models;
	}
}

export async function getModels(appLogger: Logger): Promise<Models> {
	try {
		if (!models) {
			appLogger.error('Models have not been initialized');
			try {
				appLogger.info('Attempting to load models');
				models = await initializeModels(sequelize, logger);
				if (models) {
					appLogger.info('Models loaded');
					return models;
				}
			} catch (dbError) {
				const databaseError = new errorClasses.DatabaseErrorRecoverable(
					`Error occurred within getModels() - models were uninitialized when function was called and getModels() failed to initialize them: ${dbError instanceof Error ? dbError.message : dbError}`,
					{
						exposeToClient: false
					}
				);
				ErrorLogger.logInfo(databaseError.message, logger);
				processError(databaseError, logger);

				logger.debug('Returning empty object in lieu of models');

				return {} as Models;
			}
		}
		return models as Models;
	} catch (dbError) {
		const DatabaseError = new errorClasses.DatabaseErrorRecoverable(
			`Error occurred while attempting to retrieve models using getModels(): ${dbError instanceof Error ? dbError.message : dbError}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(DatabaseError.message, logger);
		processError(DatabaseError, logger);

		logger.debug('Returning empty object in lieu of models');
		return {} as Models;
	}
}
