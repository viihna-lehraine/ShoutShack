import express, { Request, Response, Router, NextFunction } from 'express';
import { AppError } from '../config/errorClasses';
import { Logger } from '../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';

interface TestRouteDependencies {
	logger: Logger;
	environmentVariables: typeof import('../config/environmentConfig').environmentVariables;
}

export default function createTestRouter(deps: TestRouteDependencies): Router {
	const router = express.Router();
	const { logger, environmentVariables } = deps;

	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'environmentVariables', instance: environmentVariables }
			],
			logger
		);
	} catch (error) {
		handleGeneralError(error as Error, logger || console);
		throw error;
	}

	// check if we are in a non-production environment
	if (environmentVariables.nodeEnv === 'production') {
		router.use((_req: Request, res: Response) => {
			res.status(404).json({
				message: 'Test routes are not available in production.'
			});
		});
		return router;
	}

	// define test routes only if not in production
	router.get('/test', (req: Request, res: Response, next: NextFunction) => {
		try {
			logger.info('Test route was accessed.');
			res.send('Test route is working!');
		} catch (error) {
			handleGeneralError(
				(error as Error) || (error as AppError),
				logger,
				req
			);
			next(new Error('Internal server error on test route'));
		}
	});

	// general error handler for uncaught errors in the router
	router.use(
		(error: unknown, req: Request, res: Response, next: NextFunction) => {
			try {
				if (error instanceof Error) {
					logger.error(`Unexpected error on test route: `, {
						stack: error.stack
					});
				} else {
					logger.error(
						'Unexpected non-error thrown on test route',
						error
					);
				}
				res.status(500).json({
					error: 'Internal server error on test route'
				});
			} catch (error) {
				handleGeneralError(error as Error, logger, req);
				next(error);
			}
		}
	);

	return router;
}
