import { Request, Response, NextFunction } from 'express';
import {
	AddIpToBlacklistInterface,
	InitIpBlacklistInterface,
	LoadIpBlacklistInterface,
	PreInitIpBlacklistInterface,
	RemoveIpFromBlacklistInterface,
	SaveIpBlacklistInterface
} from '../index/middlewareInterfaces';
import { ProcessErrorStaticParameters } from '../parameters/errorParameters';
import {
	AddIpToBlacklistStaticParameters,
	LoadIpBlacklistParameters,
	RemoveIpFromBlacklistStaticParameters,
	SaveIpBlacklistParameters
} from '../parameters/middlewareParameters';

let blacklist: string[] = [];

export const loadIpBlacklist = async (
	LoadIpBlacklistParameters: LoadIpBlacklistInterface
): Promise<void> => {
	const params = LoadIpBlacklistParameters;

	params.validateDependencies(
		[{ name: 'fsModule', instance: params.fsModule }],
		params.appLogger
	);

	const filePath = params.configService.getEnvVariables().serverDataFilePath2;

	try {
		if (await params.fsModule.stat(filePath)) {
			const data = await params.fsModule.readFile(filePath, 'utf8');
			blacklist = JSON.parse(data);
			params.appLogger.info('Blacklist loaded successfully');
		}
	} catch (utilError) {
		const expressMiddlwareError =
			new params.errorClasses.UtilityErrorRecoverable(
				`Error occured when attempting to load IP blacklist with utility 'loadIpBlacklist()'\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{
					utility: 'loadIpBlacklist()',
					originalError: utilError,
					statusCode: 500,
					ErrorSeverity: params.ErrorSeverity.RECOVERABLE,
					exposeToClient: false
				}
			);
		params.errorLogger.logWarning(
			expressMiddlwareError.message,
			{},
			params.appLogger,
			params.ErrorSeverity.WARNING
		);
		params.processError({
			...ProcessErrorStaticParameters,
			error: expressMiddlwareError,
			appLogger: params.appLogger,
			details: { reason: 'Failed to load IP blacklist' }
		});
	}
};

const saveIpBlacklist = async (
	SaveIpBlacklistParameters: SaveIpBlacklistInterface
): Promise<void> => {
	const params = SaveIpBlacklistParameters;

	params.validateDependencies(
		[{ name: 'fsModule', instance: params.fsModule }],
		params.appLogger
	);

	if (params.configService.getFeatureFlags().enableIpBlacklist) {
		const filePath =
			params.configService.getEnvVariables().serverDataFilePath2;
		try {
			await params.fsModule.writeFile(
				filePath,
				JSON.stringify(blacklist)
			);
			params.appLogger.info('Blacklist saved successfully');
		} catch (utilError) {
			const utility: string = 'saveIpBlacklist()';
			const utilityError =
				new params.errorClasses.UtilityErrorRecoverable(
					`Error occured when attempting to save IP blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{ exposeToClient: false }
				);
			const actionManual: string = 'save_ip_blacklist';
			params.errorLogger.logWarning(
				utilityError.message,
				params.errorLoggerDetails(params.getCallerInfo, actionManual),
				params.appLogger,
				params.ErrorSeverity.WARNING
			);
			params.processError({
				...ProcessErrorStaticParameters,
				error: utilityError,
				appLogger: params.appLogger,
				details: { reason: 'Failed to save IP blacklist' }
			});
		}
	}
};

export const preInitIpBlacklist = async (
	PreInitIpBlacklistParameters: PreInitIpBlacklistInterface
): Promise<void> => {
	const params = PreInitIpBlacklistParameters;

	params.validateDependencies(
		[{ name: 'fsModule', instance: params.fsModule }],
		params.appLogger
	);

	if (params.configService.getFeatureFlags().enableIpBlacklist) {
		params.appLogger.info(
			'IP blacklist middleware is enabled. Initializing blacklist'
		);
		try {
			await loadIpBlacklist(LoadIpBlacklistParameters);
			params.appLogger.info(
				'Blacklist and range_check module loaded successfully'
			);
		} catch (utilError) {
			const utilityError =
				new params.errorClasses.UtilityErrorRecoverable(
					`Error occured when initializing IP blacklist:\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{
						utiliy: 'initializeIpBlacklist()',
						originalError: utilError,
						statusCode: 500,
						severity: params.ErrorSeverity.RECOVERABLE,
						exposeToClient: false
					}
				);
			params.errorLogger.logWarning(
				utilityError.message,
				params.errorLoggerDetails(
					params.getCallerInfo,
					'INIT_IP_BLACKLIST'
				),
				params.appLogger,
				params.ErrorSeverity.WARNING
			);
			params.processError({
				...ProcessErrorStaticParameters,
				error: utilityError,
				appLogger: params.appLogger,
				details: { reason: 'Failed to initialize IP blacklist' }
			});
		}
	} else {
		params.appLogger.debug('IP blacklist middleware is disabled');
	}
};

export const addIpToBlacklist = async (ip: string): Promise<void> => {
	const params: AddIpToBlacklistInterface = {
		...AddIpToBlacklistStaticParameters,
		ip
	};

	params.validateDependencies(
		[{ name: 'ip', instance: ip }],
		params.appLogger
	);

	try {
		if (params.configService.getFeatureFlags().enableIpBlacklist) {
			params.appLogger.info(
				'IP Blacklist is enabled. Adding IP to blacklist'
			);
			if (!blacklist.includes(ip)) {
				blacklist.push(ip);
				await saveIpBlacklist(SaveIpBlacklistParameters);
				params.appLogger.info(`IP ${ip} added to blacklist`);
			} else {
				params.appLogger.info('IP already in blacklist');
			}
		} else {
			params.appLogger.info('IP Blacklist is disabled');
		}
	} catch (utilError) {
		const utility: string = 'addToBlacklist()';
		const utilityError = new params.errorClasses.UtilityErrorRecoverable(
			`Error occured when attempting to add IP address ${ip} to blacklist using the utility ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{
				severity: params.ErrorSeverity.WARNING,
				exposeToClient: false
			}
		);
		params.errorLogger.logWarning(
			utilityError.message,
			params.errorLoggerDetails(
				params.getCallerInfo,
				'ADD_IP_TO_BLACKLIST'
			),
			params.appLogger,
			params.ErrorSeverity.WARNING
		);
		params.processError({
			...ProcessErrorStaticParameters,
			error: utilityError,
			appLogger: params.appLogger,
			details: { reason: 'Failed to add IP address to blacklist' }
		});
	}
};

export const removeIpFromBlacklist = async (ip: string): Promise<void> => {
	const params: RemoveIpFromBlacklistInterface = {
		...RemoveIpFromBlacklistStaticParameters,
		ip
	};

	params.validateDependencies(
		[{ name: 'ip', instance: ip }],
		params.appLogger
	);

	try {
		if (params.configService.getFeatureFlags().enableIpBlacklist) {
			blacklist = blacklist.filter(range => range !== ip);
			await saveIpBlacklist(SaveIpBlacklistParameters);
			params.appLogger.info(`IP ${ip} removed from blacklist`);
		}
	} catch (utilError) {
		const utilityError = new params.errorClasses.UtilityErrorRecoverable(
			`Error occured when removing IP address ${ip} from blacklist\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{
				utility: 'removeFromBlacklist()',
				originalError: utilError,
				statusCode: 500,
				severity: params.ErrorSeverity.WARNING,
				exposeToClient: false
			}
		);
		params.errorLogger.logWarning(
			utilityError.message,
			params.errorLoggerDetails(
				params.getCallerInfo,
				'IP_BLACKLIST_REMOVE_ENTRY'
			),
			params.appLogger,
			params.ErrorSeverity.WARNING
		);
		params.processError({
			...ProcessErrorStaticParameters,
			error: utilityError,
			appLogger: params.appLogger,
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
			params.appLogger
		);

		try {
			if (params.configService.getFeatureFlags().enableIpBlacklist) {
				params.appLogger.info('IP Blacklist middleware enabled');
				const clientIp = req.ip;

				if (!clientIp) {
					params.appLogger.info('Client IP not found');
					res.status(500).json({ error: 'Bad request' });
					return;
				}

				if (blacklist.some(range => params.inRange(clientIp, range))) {
					params.appLogger.info(
						`Blocked request from blacklisted IP: ${clientIp}`
					);
					res.status(403).json({ error: 'Access denied' });
					return;
				}
			} else {
				params.appLogger.debug('IP Blacklist middleware disabled');
			}
		} catch (expressError) {
			const expressMiddlewareError = new params.errorClasses.ExpressError(
				`Error occurred when initializing 'initIpBlacklist()'\n${expressError instanceof Error ? expressError.message : String(expressError)}`,
				{
					middleware: 'initializeIpBlacklistMiddleware()',
					originalError: expressError,
					statusCode: 500,
					severity: params.ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			params.errorLogger.logError(
				expressMiddlewareError,
				params.errorLoggerDetails(
					params.getCallerInfo,
					'INIT_IP_BLACKLIST_MIDDLEWARE'
				),
				params.appLogger,
				params.ErrorSeverity.FATAL
			);
			params.expressErrorHandler();
		}

		next();
	};
