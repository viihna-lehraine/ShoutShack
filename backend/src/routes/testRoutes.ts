import express, { Request, Response, Router } from 'express';

interface TestRouteDependencies {
	logger: {
		info: (msg: string) => void;
	};
}

export default function createTestRouter(deps: TestRouteDependencies): Router {
	const router = express.Router();
	const { logger } = deps;

	router.get('/test', (req: Request, res: Response) => {
		logger.info('Test route was accessed.');
		res.send('Test route is working!');
	});

	return router;
}
