import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import { IncomingMessage } from 'http';
import morgan, { StreamOptions } from 'morgan';
import rawBody from 'raw-body';
import responseTime from 'response-time';
import { XMLParser } from 'fast-xml-parser';
import { ServiceFactory } from '../index/factory';
import { withRetry } from '../utils/helpers';
import {
	blankRequest,
	blankResponse,
	blankNextFunction
} from '../config/express';
import {
	AppLoggerServiceInterface,
	ErrorLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	MiddlewareStatusServiceInterface,
	RootMiddlewareServiceInterface
} from '../index/interfaces/services';
import { XMLParsedRequest } from '../index/interfaces/serviceComponents';

export class RootMiddlewareService implements RootMiddlewareServiceInterface {
	private static instance: RootMiddlewareService | null = null;

	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private middlewareStatusService: MiddlewareStatusServiceInterface;

	private totalResponseTime = 0;
	private requestCount = 0;
	private errorCount = 0;
	private openConnections = 0;
	private requestsPerSecond = 0;
	private requestStatsInterval: NodeJS.Timeout | null = null;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		middlewareStatusService: MiddlewareStatusServiceInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.middlewareStatusService = middlewareStatusService;
	}

	public static async getInstance(): Promise<RootMiddlewareService> {
		if (!RootMiddlewareService.instance) {
			const logger = await ServiceFactory.getLoggerService();
			const errorLogger = await ServiceFactory.getErrorLoggerService();
			const errorHandler = await ServiceFactory.getErrorHandlerService();
			const middlewareStatusService =
				await ServiceFactory.getMiddlewareStatusService();
			RootMiddlewareService.instance = new RootMiddlewareService(
				logger,
				errorLogger,
				errorHandler,
				middlewareStatusService
			);
		}

		return RootMiddlewareService.instance;
	}

	public trackResponseTime(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const startHrTime = process.hrtime();
		this.openConnections += 1;

		res.on('finish', () => {
			const diff = process.hrtime(startHrTime);
			const duration = diff[0] * 1e3 + diff[1] / 1e6;

			this.totalResponseTime += duration;
			this.requestCount += 1;
			this.openConnections -= 1;

			const averageResponseTime =
				this.totalResponseTime / this.requestCount;

			if (res.statusCode >= 400) {
				this.errorCount += 1;
			}

			this.logMetrics(averageResponseTime);
		});

		next();
	}

	public calculateRequestsPerSecond(): void {
		setInterval(() => {
			this.requestsPerSecond = this.requestCount / process.uptime();
		}, 1000);
	}

	public getAverageResponseTime(): number {
		const averageResponseTime =
			this.totalResponseTime / (this.requestCount || 1);
		return averageResponseTime;
	}

	private logMetrics(averageResponseTime: number): void {
		this.logger.info(
			`Average Response Time: ${averageResponseTime.toFixed(2)} ms`
		);
		this.logger.info(`Total Requests: ${this.requestCount}`);
		this.logger.info(`Requests Per Second: ${this.requestsPerSecond}`);
		this.logger.info(`Open Connections: ${this.openConnections}`);
		this.logger.info(`Error Count: ${this.errorCount}`);
	}

	public xmlParserMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		const contentType = req.headers['content-type'] as string | undefined;

		if (contentType === 'application/xml') {
			rawBody(req as unknown as IncomingMessage, { encoding: 'utf-8' })
				.then((xmlData: string) => {
					try {
						(req as XMLParsedRequest).parsedXmlBody =
							new XMLParser().parse(xmlData);
						next();
					} catch (err) {
						res.status(400).send('Invalid XML format');
						next(err);
					}
				})
				.catch(err => {
					res.status(500).send('Error reading XML body');
					next(err);
				});
		} else {
			next();
		}
	}

	public async applyMiddlewares(app: express.Application): Promise<void> {
		const stream: StreamOptions = {
			write: (message: string) => this.logger.info(message.trim())
		};

		const setMiddlewareStatus = (
			name: string,
			status: 'on' | 'off',
			error?: unknown
		): void => {
			this.middlewareStatusService.setStatus(name, status);
			if (status === 'off') {
				this.errorLogger.logError(
					`Middleware "${name}" has failed: ${error}`
				);
			}
		};

		const addMiddleware = async (
			name: string,
			middlewareFn: () => void
		): Promise<void> => {
			try {
				await withRetry(
					async () => {
						if (this.middlewareStatusService.isMiddlewareOn(name)) {
							middlewareFn();
							setMiddlewareStatus(name, 'on');
						}
					},
					5,
					2000
				);
			} catch (err) {
				setMiddlewareStatus(name, 'off', err);
				const middlewareError =
					new this.errorHandler.ErrorClasses.RootMiddlewareError(
						`Error occurred while applying middleware: ${name}`,
						{ exposeToClient: false }
					);
				this.errorHandler.expressErrorHandler()(
					middlewareError,
					blankRequest,
					blankResponse,
					blankNextFunction
				);
			}
		};

		try {
			await addMiddleware('express.text', () => app.use(express.text()));
			await addMiddleware('express.json', () => app.use(express.json()));
			await addMiddleware('express.urlencoded', () =>
				app.use(express.urlencoded({ extended: true }))
			);
			await addMiddleware('cookieParser', () => app.use(cookieParser()));
			await addMiddleware('xmlParserMiddleware', () =>
				app.use(this.xmlParserMiddleware)
			);
			await addMiddleware('morganLogger', () =>
				app.use(morgan('combined', { stream }))
			);
			await addMiddleware('cors', () => app.use(cors()));
			await addMiddleware('responseTime', () => app.use(responseTime()));
			await addMiddleware('trackResponseTime', () =>
				app.use(this.trackResponseTime.bind(this))
			);
			await addMiddleware('etag (strong)', () =>
				app.set('etag', 'strong')
			);
			await addMiddleware('trustProxy', () =>
				app.set('trust proxy', true)
			);
		} catch (err) {
			this.errorLogger.logError(
				`Error applying root level middleware\n${err instanceof Error ? err.message : String(err)}`
			);
			const rootMiddlewareError =
				new this.errorHandler.ErrorClasses.RootMiddlewareError(
					`Error occurred while applying root level middleware`,
					{ exposeToClient: false }
				);
			this.errorHandler.expressErrorHandler()(
				rootMiddlewareError,
				{} as express.Request,
				{} as express.Response,
				() => {}
			);
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Shutting down RootMiddlewareService...');

			// Clear the interval tracking requests per second, if it exists
			if (this.requestStatsInterval) {
				clearInterval(this.requestStatsInterval);
				this.logger.info('Cleared requests per second interval.');
			}

			this.totalResponseTime = 0;
			this.requestCount = 0;
			this.errorCount = 0;
			this.openConnections = 0;
			this.requestsPerSecond = 0;

			RootMiddlewareService.instance = null;

			this.logger.info('RootMiddlewareService shutdown completed.');
		} catch (error) {
			const shutdownError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during RootMiddlewareService shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			this.errorLogger.logError(shutdownError.message);
			this.errorHandler.handleError({ error: shutdownError });
		}
	}
}
