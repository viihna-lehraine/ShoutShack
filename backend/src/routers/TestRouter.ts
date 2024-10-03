import { Request, Response, NextFunction } from 'express';
import { BaseRouter } from './BaseRouter';

// *DEV-NOTE* need to create a test page to utilize this router

export class TestRouter extends BaseRouter {
	private nodeEnv = this.envConfig.getEnvVariable('nodeEnv');

	private constructor() {
		super();
		this.setUpTestRoutes();
	}

	private setUpTestRoutes(): void {
		if (this.nodeEnv === 'production') {
			this.router.use((_req: Request, res: Response) => {
				this.logger.info(
					'Test route accessed in production environment.'
				);
				res.status(404).json({
					message: 'Test routes are not available in production.'
				});
			});
		} else {
			this.router.connect('/test', this.testConnectRoute.bind(this));
			this.router.delete('/test', this.testDeleteRoute.bind(this));
			this.router.get('/test', this.testGetRoute.bind(this));
			this.router.head('/test', this.testHeadRoute.bind(this));
			this.router.options('/test', this.testOptionsRoute.bind(this));
			this.router.patch('/test', this.testPatchRoute.bind(this));
			this.router.post('/test', this.testPostRoute.bind(this));
			this.router.put('/test', this.testPutRoute.bind(this));
			this.router.trace('/test', this.testTraceRoute.bind(this));
		}

		this.router.use(this.handleTestRouteErrors.bind(this));
	}

	private testConnectRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testDeleteRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('DELETE Test route accessed.');
			res.send('DELETE Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testGetRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testHeadRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testOptionsRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testPatchRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testPostRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('POST Test route accessed.');
			res.send('POST Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testPutRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('PUT Test route accessed.');
			res.send('PUT Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private testTraceRoute(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		try {
			this.logger.info('Test route accessed.');
			res.send('Test route is working!');
		} catch (error) {
			this.handleRouteError(error, req, res, next);
		}
	}

	private handleTestRouteErrors(
		error: unknown,
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		if (error instanceof Error) {
			this.logger.error('Unexpected error on test route');
			this.errorHandler.expressErrorHandler()(error, req, res, next);
		} else {
			this.logger.error(
				'Unexpected non-error thrown on test route',
				error
			);
			this.errorHandler.handleError({
				error: error as string,
				req
			});
		}
		res.status(500).json({
			error: 'Internal routing error on test route'
		});
	}
}
