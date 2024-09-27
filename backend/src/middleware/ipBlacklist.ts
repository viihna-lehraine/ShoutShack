import { Request, Response, NextFunction } from 'express';
import {
	AddIpToBlacklistInterface,
	InitIpBlacklistInterface,
	LoadIpBlacklistInterface,
	RemoveIpFromBlacklistInterface,
	SaveIpBlacklistInterface
} from '../index/interfaces';
import {
	AddIpToBlacklistStaticParameters,
	HandleErrorStaticParameters,
	LoadIpBlacklistParameters,
	RemoveIpFromBlacklistStaticParameters,
	SaveIpBlacklistParameters
} from '../index/parameters';
import { ServiceFactory } from '../index/factory';

let blacklist: string[] = [];

const logger = ServiceFactory.getLoggerService();
const errorLogger = ServiceFactory.getErrorLoggerService();
const errorHandler = ServiceFactory.getErrorHandlerService();
const configService = ServiceFactory.getConfigService();

export const loadIpBlacklist = async (
	LoadIpBlacklistParameters: LoadIpBlacklistInterface
): Promise<void> => {
	const params = LoadIpBlacklistParameters;
	const filePath = configService.getEnvVariable('serverDataFilePath1');

	if (typeof filePath !== 'string') {
		const errorMsg =
			'Invalid file path for serverDataFilePath1: not a string.';
		logger.error(errorMsg);
		throw new Error(errorMsg);
	}

	try {
		if (await params.fsModule.stat(filePath)) {
			const data = await params.fsModule.readFile(filePath, 'utf8');
			blacklist = JSON.parse(data);
			logger.info('Blacklist loaded successfully');
		}
	} catch (utilError) {
		const expressMiddlwareError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to load IP blacklist\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{
					utility: 'loadIpBlacklist()',
					originalError: utilError
				}
			);
		errorLogger.logWarn(expressMiddlwareError.message);
		errorHandler.handleError({
			...HandleErrorStaticParameters,
			error: expressMiddlwareError,
			details: { reason: 'Failed to load IP blacklist' }
		});
	}
};

const saveIpBlacklist = async (
	SaveIpBlacklistParameters: SaveIpBlacklistInterface
): Promise<void> => {
	const params = SaveIpBlacklistParameters;

	if (configService.getFeatureFlags().enableIpBlacklist) {
		const filePath = configService.getEnvVariable('serverDataFilePath2');

		if (typeof filePath !== 'string') {
			const errorMsg =
				'Invalid file path for serverDataFilePath1: not a string.';
			logger.error(errorMsg);
			throw new Error(errorMsg);
		}

		try {
			await params.fsModule.writeFile(
				filePath,
				JSON.stringify(blacklist)
			);
			logger.info('Blacklist saved successfully');
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured when attempting to save IP blacklist \n${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{ exposeToClient: false }
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({
				...HandleErrorStaticParameters,
				error: utilityError,
				details: { reason: 'Failed to save IP blacklist' }
			});
		}
	}
};

export const preInitIpBlacklist = async (): Promise<void> => {
	if (configService.getFeatureFlags().enableIpBlacklist) {
		logger.info(
			'IP blacklist middleware is enabled. Initializing blacklist'
		);
		try {
			await loadIpBlacklist(LoadIpBlacklistParameters);
			logger.info('Blacklist and range_check module loaded successfully');
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured when initializing IP blacklist\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{
						utiliy: 'initializeIpBlacklist()',
						originalError: utilError
					}
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({
				...HandleErrorStaticParameters,
				error: utilityError,
				details: { reason: 'Failed to initialize IP blacklist' }
			});
		}
	} else {
		logger.debug('IP blacklist middleware is disabled');
	}
};

export const addIpToBlacklist = async (ip: string): Promise<void> => {
	const params: AddIpToBlacklistInterface = {
		...AddIpToBlacklistStaticParameters,
		ip
	};
	params.validateDependencies([{ name: 'ip', instance: ip }], logger);

	try {
		if (configService.getFeatureFlags().enableIpBlacklist) {
			logger.info('IP Blacklist is enabled. Adding IP to blacklist');
			if (!blacklist.includes(ip)) {
				blacklist.push(ip);
				await saveIpBlacklist(SaveIpBlacklistParameters);
				logger.info(`IP ${ip} added to blacklist`);
			} else {
				logger.info('IP already in blacklist');
			}
		} else {
			logger.info('IP Blacklist is disabled');
		}
	} catch (utilError) {
		const utilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to add IP address ${ip} to blacklist\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{ exposeToClient: false }
			);
		errorLogger.logWarn(utilityError.message);
		errorHandler.handleError({
			...HandleErrorStaticParameters,
			error: utilityError,
			details: { reason: 'Failed to add IP address to blacklist' }
		});
	}
};

export const removeIpFromBlacklist = async (ip: string): Promise<void> => {
	const params: RemoveIpFromBlacklistInterface = {
		...RemoveIpFromBlacklistStaticParameters,
		ip
	};
	params.validateDependencies([{ name: 'ip', instance: ip }], logger);

	try {
		if (configService.getFeatureFlags().enableIpBlacklist) {
			blacklist = blacklist.filter(range => range !== ip);
			await saveIpBlacklist(SaveIpBlacklistParameters);
			logger.info(`IP ${ip} removed from blacklist`);
		}
	} catch (utilError) {
		const utilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured when removing IP address ${ip} from blacklist\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{
					utility: 'removeFromBlacklist()',
					originalError: utilError
				}
			);
		errorLogger.logWarn(utilityError.message);
		errorHandler.handleError({
			...HandleErrorStaticParameters,
			error: utilityError,
			details: { reason: 'Failed to remove IP address from blacklist' }
		});
	}
};

export const initIpBlacklist =
	(InitIpBlacklistParameters: InitIpBlacklistInterface) =>
	(req: Request, res: Response, next: NextFunction): void => {
		const params = InitIpBlacklistParameters;

		params.validateDependencies(
			[{ name: 'fsModule', instance: params.fsModule }],
			logger
		);

		try {
			if (configService.getFeatureFlags().enableIpBlacklist) {
				logger.info('IP Blacklist middleware enabled');
				const clientIp = req.ip;

				if (!clientIp) {
					logger.info('Client IP not found');
					res.status(500).json({ error: 'Bad request' });
					return;
				}

				if (blacklist.some(range => params.inRange(clientIp, range))) {
					logger.info(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					res.status(403).json({ error: 'Access denied' });
					return;
				}
			} else {
				logger.debug('IP Blacklist middleware disabled');
			}
		} catch (expressError) {
			const expressMiddlewareError =
				new errorHandler.ErrorClasses.ExpressError(
					`Error occurred when initializing 'initIpBlacklist()'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
					{
						middleware: 'initializeIpBlacklistMiddleware()',
						originalError: expressError
					}
				);
			errorLogger.logError(expressMiddlewareError.message);
			errorHandler.expressErrorHandler();
		}

		next();
	};
