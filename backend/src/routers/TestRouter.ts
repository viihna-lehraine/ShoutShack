import { Request, Response, NextFunction } from 'express';
import { BaseRouter } from './BaseRouter';

export class TestRouter extends BaseRouter {
	private static instance: TestRouter | null = null;
	private nodeEnv: string;

	private constructor() {
		super();
		this.nodeEnv = this.configService.getEnvVariable('nodeEnv');
		this.setUpRoutes();
	}

	public static getInstance(): TestRouter {
		if (!TestRouter.instance) {
			TestRouter.instance = new TestRouter();
		}

		return TestRouter.instance;
	}

	private setUpRoutes(): void {
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
			this.router.get('/test', this.testRoute.bind(this));
		}

		this.router.use(this.handleTestRouteErrors.bind(this));
	}

	private testRoute(req: Request, res: Response, next: NextFunction): void {
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
