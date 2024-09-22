import express from 'express';
import fs from 'fs';
import * as cryptoConstants from 'crypto';
import { configService } from '../services/configService';
import {
	DeclareWebServerOptionsInterface,
	SetUpWebServerInterface
} from '../interfaces/webServerInterfaces';
import { sequelize } from '../config/database';
import { blankRequest } from '../utils/helpers';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { errorLogger } from '../services/errorLogger';
import {
	getCallerInfo,
	errorLoggerDetails,
	validateDependencies
} from '../utils/helpers';
import { processError } from '../errors/processError';

export const tlsCiphers: string[] = [
	'ECDHE-ECDSA-AES256-GCM-SHA384',
	'ECDHE-RSA-AES256-GCM-SHA384',
	'ECDHE-ECDSA-CHACHA20-POLY1305',
	'ECDHE-RSA-CHACHA20-POLY1305',
	'ECDHE-ECDSA-AES128-GCM-SHA256',
	'ECDHE-RSA-AES128-GCM-SHA256',
	'ECDHE-ECDSA-AES256-SHA384',
	'ECDHE-RSA-AES256-SHA384',
	'ECDHE-ECDSA-AES128-SHA256',
	'ECDHE-RSA-AES128-SHA256'
];

export const DeclareWebServerOptionsParameters: DeclareWebServerOptionsInterface =
	{
		appLogger: configService.getAppLogger(),
		blankRequest,
		configService,
		constants: cryptoConstants,
		fs: fs.promises,
		errorClasses,
		errorLogger,
		errorLoggerDetails,
		ErrorSeverity,
		getCallerInfo,
		processError,
		tlsCiphers,
		validateDependencies
	};

export const SetUpWebServerParameters: SetUpWebServerInterface = {
	app: express(),
	appLogger: configService.getAppLogger(),
	blankRequest,
	DeclareWebServerOptionsParameters,
	envVariables: configService.getEnvVariables(),
	errorLogger,
	errorLoggerDetails,
	featureFlags: configService.getFeatureFlags(),
	getCallerInfo,
	processError,
	sequelize
};
