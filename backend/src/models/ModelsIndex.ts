import { Sequelize } from 'sequelize';
import { AppError } from '../config/errorClasses';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';
import { loadModels, Models } from './loadModels';
import { environmentVariables } from '../config/environmentConfig';
import { Logger, setupLogger } from '../config/logger';

const logger: Logger = setupLogger({
	logLevel: environmentVariables.nodeEnv === 'production' ? 'info' : 'debug'
});

let models: Models | null = null;

let sequelize: Sequelize;

export async function initializeModels(
	sequelize: Sequelize,
	logger: Logger
): Promise<Models> {
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
		return models as Models;
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw new AppError('Internal Server Error', 500);
	}
}

export async function getModels(): Promise<Models> {
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
				handleGeneralError(error, logger || console);
				throw new AppError('Internal Server Error', 500);
			}
		}
		return models as Models;
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw new AppError('Internal Server Error', 500);
	}
}
