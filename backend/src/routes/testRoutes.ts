import express, { Request, Response, Router, NextFunction } from 'express';
import { Logger, setupLogger } from '../config/logger';

interface TestRouteDependencies {
	logger: Logger;
}

// Create a test router
export default function createTestRouter(deps: TestRouteDependencies): Router {
	const router = express.Router();
	const { logger } = deps;

	router.get('/test', (req: Request, res: Response, next: NextFunction) => {
		try {
			logger.info('Test route was accessed.');
			res.send('Test route is working!');
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error on test route: ${error.message}`, {
					stack: error.stack
				});
			} else {
				logger.error('Unknown error on test route', { error });
			}
			next(new Error('Internal server error on test route'));
		}
	});

	// general error handler for uncaught errors in the router
	router.use((err: unknown, req: Request, res: Response) => {
		if (err instanceof Error) {
			logger.error(`Unexpected error on test route: `, {
				stack: err.stack
			});
		} else {
			logger.error('Unexpected non-error thrown on test route', {
				error: err
			});
		}
		res.status(500).json({
			error: 'Internal server error on test route'
		});
	});

	return router;
}

// initialize the logger for the test router
const logger = setupLogger({ serviceName: 'TestRouter' });

// Export the test router instance
export const testRouter = createTestRouter({ logger });
