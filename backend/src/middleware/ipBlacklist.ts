import { Request, Response, NextFunction } from 'express';
import {
	AddIpToBlacklistInterface,
	InitIpBlacklistInterface,
	LoadIpBlacklistInterface,
	PreInitIpBlacklistInterface,
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

let blacklist: string[] = [];

export const loadIpBlacklist = async (
	LoadIpBlacklistParameters: LoadIpBlacklistInterface
): Promise<void> => {
	const params = LoadIpBlacklistParameters;
	const logger = params.configService.getAppLogger();

	const filePath = params.configService.getEnvVariables().serverDataFilePath2;

	try {
		if (await params.fsModule.stat(filePath)) {
			const data = await params.fsModule.readFile(filePath, 'utf8');
			blacklist = JSON.parse(data);
			logger.info('Blacklist loaded successfully');
		}
	} catch (utilError) {
		const expressMiddlwareError =
			new params.errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to load IP blacklist with utility 'loadIpBlacklist()'\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{
					utility: 'loadIpBlacklist()',
					originalError: utilError
				}
			);
		params.configService
			.getErrorLogger()
			.logWarn(expressMiddlwareError.message);
		params.errorHandler.handleError({
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
	const logger = params.configService.getAppLogger();
	const errorLogger = params.configService.getErrorLogger();

	if (params.configService.getFeatureFlags().enableIpBlacklist) {
		const filePath =
			params.configService.getEnvVariables().serverDataFilePath2;
		try {
			await params.fsModule.writeFile(
				filePath,
				JSON.stringify(blacklist)
			);
			logger.info('Blacklist saved successfully');
		} catch (utilError) {
			const utility: string = 'saveIpBlacklist()';
			const utilityError =
				new params.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured when attempting to save IP blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{ exposeToClient: false }
				);
			errorLogger.logWarn(utilityError.message);
			params.errorHandler.handleError({
				...HandleErrorStaticParameters,
				error: utilityError,
				details: { reason: 'Failed to save IP blacklist' }
			});
		}
	}
};

export const preInitIpBlacklist = async (
	PreInitIpBlacklistParameters: PreInitIpBlacklistInterface
): Promise<void> => {
	const params = PreInitIpBlacklistParameters;
	const logger = params.configService.getAppLogger();

	if (params.configService.getFeatureFlags().enableIpBlacklist) {
		logger.info(
			'IP blacklist middleware is enabled. Initializing blacklist'
		);
		try {
			await loadIpBlacklist(LoadIpBlacklistParameters);
			logger.info('Blacklist and range_check module loaded successfully');
		} catch (utilError) {
			const utilityError =
				new params.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occured when initializing IP blacklist:\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{
						utiliy: 'initializeIpBlacklist()',
						originalError: utilError
					}
				);
			params.configService.getErrorLogger().logWarn(utilityError.message);
			params.errorHandler.handleError({
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
	const logger = params.configService.getAppLogger();

	params.validateDependencies([{ name: 'ip', instance: ip }], logger);

	try {
		if (params.configService.getFeatureFlags().enableIpBlacklist) {
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
		const utility: string = 'addToBlacklist()';
		const utilityError =
			new params.errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to add IP address ${ip} to blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{ exposeToClient: false }
			);
		params.configService.getErrorLogger().logWarn(utilityError.message);
		params.errorHandler.handleError({
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
	const logger = params.configService.getAppLogger();

	params.validateDependencies([{ name: 'ip', instance: ip }], logger);

	try {
		if (params.configService.getFeatureFlags().enableIpBlacklist) {
			blacklist = blacklist.filter(range => range !== ip);
			await saveIpBlacklist(SaveIpBlacklistParameters);
			logger.info(`IP ${ip} removed from blacklist`);
		}
	} catch (utilError) {
		const utilityError =
			new params.errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured when removing IP address ${ip} from blacklist\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{
					utility: 'removeFromBlacklist()',
					originalError: utilError
				}
			);
		params.configService.getErrorLogger().logWarn(utilityError.message);
		params.errorHandler.handleError({
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
			params.logger
		);

		try {
			if (params.configService.getFeatureFlags().enableIpBlacklist) {
				params.logger.info('IP Blacklist middleware enabled');
				const clientIp = req.ip;

				if (!clientIp) {
					params.logger.info('Client IP not found');
					res.status(500).json({ error: 'Bad request' });
					return;
				}

				if (blacklist.some(range => params.inRange(clientIp, range))) {
					params.logger.info(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					res.status(403).json({ error: 'Access denied' });
					return;
				}
			} else {
				params.logger.debug('IP Blacklist middleware disabled');
			}
		} catch (expressError) {
			const expressMiddlewareError =
				new params.errorHandler.ErrorClasses.ExpressError(
					`Error occurred when initializing 'initIpBlacklist()'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
					{
						middleware: 'initializeIpBlacklistMiddleware()',
						originalError: expressError
					}
				);
			params.errorLogger.logError(expressMiddlewareError.message);
			params.errorHandler.expressErrorHandler();
		}

		next();
	};
