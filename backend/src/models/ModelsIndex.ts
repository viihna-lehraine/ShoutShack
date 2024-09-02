import { Sequelize } from 'sequelize';
import { loadModels, Models } from './loadModels';
import { environmentVariables } from '../config/environmentConfig';
import { Logger, setupLogger } from '../config/logger';
import AppError from '../errors/AppError';

const logger: Logger = setupLogger({
	logLevel: environmentVariables.nodeEnv === 'production' ? 'info' : 'debug'
});

let models: Models | null = null;

export async function initializeModels(sequelize: Sequelize): Promise<Models> {
	try {
		if (!models) {
			logger.info('Loading models');
			models = await loadModels(sequelize);
		}
		return models as Models;
	} catch (error) {
		if (error instanceof Error) {
			logger.error(`Error initializing models: `, {
				stack: error.stack
			});
		} else {
			logger.error('An unknown error occurred while initializing models');
		}
		throw new AppError('Internal Server Error', 500);
	}
}

export function getModels(): Models {
	try {
		if (!models) {
			logger.error('Models have not been initialized');
			throw new Error('Models have not been initialized');
		}
		return models;
	} catch (error) {
		if (error instanceof Error) {
			logger.error(`Error getting models:`, {
				stack: error.stack
			});
		} else {
			logger.error('An unknown error occurred while getting models');
		}
		throw new AppError('Internal Server Error', 500);
	}
}
