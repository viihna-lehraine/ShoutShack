import * as cryptoConstants from 'crypto';

export type WebServerOptions = import('tls').SecureContextOptions;

export interface DeclareWebServerOptionsInterface {
	appLogger: import('../services/appLogger').AppLogger;
	blankRequest: import('express').Request;
	configService: typeof import('../services/configService').configService;
	constants: typeof cryptoConstants;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	fs: typeof import('fs').promises;
	getCallerInfo: () => string;
	processError: typeof import('../errors/processError').processError;
	tlsCiphers: string[];
	validateDependencies: typeof import('../utils/helpers').validateDependencies;
}

export interface SetUpWebServerInterface {
	app: import('express').Application;
	appLogger: import('../services/appLogger').AppLogger;
	blankRequest: import('express').Request;
	envVariables: import('../interfaces/environmentInterfaces').EnvVariableTypes;
	errorLogger: typeof import('../services/errorLogger').errorLogger;
	errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	DeclareWebServerOptionsParameters: DeclareWebServerOptionsInterface;
	featureFlags: import('../interfaces/environmentInterfaces').FeatureFlagTypes;
	getCallerInfo: () => string;
	processError: typeof import('../errors/processError').processError;
	sequelize: import('sequelize').Sequelize | null;
}

export interface SetUpWebServerReturn {
	startServer: () => Promise<void>;
}

export interface TLSKeys {
	cert: string;
	key: string;
}
