import { envSecretsStore } from '../environment/envSecrets';

export interface InitializeDatabase {
	readonly dbInitMaxRetries: number;
	readonly dbInitRetryAfter: number;
	readonly appLogger: import('../services/appLogger').AppLogger;
	readonly envVariables: import('./environmentInterfaces').EnvVariableTypes;
	readonly featureFlags: import('./environmentInterfaces').FeatureFlagTypes;
	readonly errorClasses: typeof import('../errors/errorClasses').errorClasses;
	readonly errorLoggerDetails: typeof import('../utils/helpers').errorLoggerDetails;
	readonly ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	readonly errorLogger: typeof import('../services/errorLogger').errorLogger;
	readonly getCallerInfo: () => string;
	readonly processError: typeof import('../errors/processError').processError;
	readonly blankRequest: import('express').Request;
	readonly envSecretsStore: typeof envSecretsStore;
}
