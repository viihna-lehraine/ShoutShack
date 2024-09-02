import express, { Request, Response, Router, NextFunction } from 'express';
import { Logger, setupLogger } from '../config/logger';

interface TestRouteDependencies {
	logger: Logger;
}

export default function createTestRouter(deps: TestRouteDependencies): Router {
	const router = express.Router();
	const { logger } = deps;

	router.get('/test', (req: Request, res: Response, next: NextFunction) => {
		try {
			logger.info('Test route was accessed.');
			res.send('Test route is working!');
		} catch (error) {
			logger.error(
				`Error on test route: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
				error instanceof Error ? { stack: error.stack } : {}
			);
			next(error);
		}
	});

	return router;
}

const logger = setupLogger({ serviceName: 'TestRouter' });
export const testRouter = createTestRouter({ logger });
