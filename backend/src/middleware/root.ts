import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, RequestHandler } from 'express';
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
} from '../config/constants';

interface XMLParsedRequest extends Request {
	parsedXmlBody?: Record<string, unknown>;
}

export async function applyRootMiddleware(
	app: express.Application
): Promise<void> {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const errorHandler = ServiceFactory.getErrorHandlerService();
	const middlewareStatusService = ServiceFactory.getMiddlewareStatusService();
	const stream: StreamOptions = {
		write: (message: string) => logger.info(message.trim())
	};
	const xmlParser = new XMLParser();

	const setMiddlewareStatus = (
		name: string,
		status: 'on' | 'off',
		error?: unknown
	): void => {
		middlewareStatusService.setStatus(name, status);
		if (status === 'off') {
			errorLogger.logError(`Middleware "${name}" has failed: ${error}`);
		}
	};

	const addMiddleware = async (
		name: string,
		middlewareFn: () => Promise<void> | void
	): Promise<void> => {
		try {
			await withRetry(
				async () => {
					if (middlewareStatusService.isMiddlewareOn(name)) {
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
				new errorHandler.ErrorClasses.RootMiddlewareError(
					`Error occurred while applying middleware: ${name}`,
					{ exposeToClient: false }
				);
			errorHandler.expressErrorHandler()(
				middlewareError,
				blankRequest,
				blankResponse,
				blankNextFunction
			);
		}
	};

	try {
		await addMiddleware('express.text', () => {
			app.use(express.text());
			return;
		});
		await addMiddleware('express.json', () => {
			app.use(express.json());
			return;
		});
		await addMiddleware('express.urlencoded', () => {
			app.use(express.urlencoded({ extended: true }));
			return;
		});
		await addMiddleware('cookieParser', () => {
			app.use(cookieParser());
			return;
		});
		await addMiddleware('cookieParser', () => {
			app.use(cookieParser());
			return;
		});
		await addMiddleware('xmlParser', () => {
			app.use(((req: unknown, res: Response, next: NextFunction) => {
				const contentType = (req as Request).get('content-type');
				if (contentType === 'application/xml') {
					rawBody(req as IncomingMessage, { encoding: 'utf-8' })
						.then((xmlData: string) => {
							try {
								(req as XMLParsedRequest).parsedXmlBody =
									new XMLParser().parse(xmlData);
								next();
							} catch (err) {
								res.status(400).send('Invalid XML format');
							}
						})
						.catch(() => {
							res.status(500).send('Error reading XML body');
						});
				} else {
					next();
				}
			}) as unknown as RequestHandler);
		});
		await addMiddleware('morganLogger', () => {
			app.use(morgan('combined', { stream }));
			return;
		});
		await addMiddleware('cors', () => {
			app.use(cors());
			return;
		});
		await addMiddleware('responseTime', () => {
			app.use(responseTime());
			return;
		});
		await addMiddleware('etag (strong)', () => {
			app.set('etag', 'strong');
			return;
		});
		await addMiddleware('etag (strong)', () => {
			app.set('trust proxy', true);
			return;
		});
	} catch (err) {
		errorLogger.logError(
			`Error applying root level middleware\n${err instanceof Error ? err.message : String(err)}`
		);
		const rootMiddlewareError =
			new errorHandler.ErrorClasses.RootMiddlewareError(
				`Error occurred while applying root level middleware`,
				{
					exposeToClient: false
				}
			);
		errorHandler.expressErrorHandler()(
			rootMiddlewareError,
			{} as express.Request,
			{} as express.Response,
			() => {}
		);
	}
}
