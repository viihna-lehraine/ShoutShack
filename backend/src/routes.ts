import argon2 from 'argon2';
import axios from 'axios';
import bcrypt from 'bcrypt';
import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss';
import { createTOTPUtil } from './auth/totpUtil';
import { configService } from './config/configService';
import { errorClasses, ErrorSeverity } from './errors/errorClasses';
import { ErrorLogger } from './errors/errorLogger';
import { getTransporter } from './config/mailer';
import { processError } from './errors/processError';
import { initializeStaticRoutes } from './routes/staticRoutes';
import { initializeTestRoutes } from './routes/testRoutes';
import initializeUserRoutes, { UserRoutesModel } from './routes/userRoutes';
import initializeValidationRoutes from './routes/validationRoutes';
import generateConfirmationEmailTemplate from './templates/confirmationEmailTemplate';
import { validateDependencies } from './utils/validateDependencies';

interface RouteDependencies {
	app: express.Application;
}

let UserRoutes: UserRoutesModel;
let validator: typeof import('validator');

export async function initializeRoutes({
	app
}: RouteDependencies): Promise<undefined> {
	const envVariables = configService.getEnvVariables();
	const appLogger = configService.getLogger();
	const featureFlags = configService.getFeatureFlags();

	try {
		validateDependencies(
			[{ name: 'app', instance: app }],
			appLogger || console
		);

		appLogger.info('Initializing routes.');

		const staticRootPath = envVariables.staticRootPath;

		const totpUtilInstance = createTOTPUtil({
			speakeasy,
			QRCode
		});

		if (
			featureFlags.loadTestRoutes &&
			envVariables.nodeEnv !== 'production'
		) {
			appLogger.info('Test routes enabled. Initializing test routes.');
			const testRoutes: Router = initializeTestRoutes({ app });
			app.use('/test', testRoutes);
		} else {
			appLogger.info('Test routes disabled or running in production.');
		}

		appLogger.info('Initializing static routes.');
		initializeStaticRoutes(app, staticRootPath, appLogger);

		// validation routes
		appLogger.info('Initializing validation routes.');
		initializeValidationRoutes({ appLogger, validator });

		// user routes
		appLogger.info('Initializing user routes.');
		initializeUserRoutes({
			UserRoutes,
			argon2,
			jwt,
			axios,
			bcrypt,
			uuidv4,
			xss,
			generateConfirmationEmailTemplate,
			getTransporter,
			totpUtil: totpUtilInstance
		});
	} catch (initRoutesError) {
		const initRoutesErrorFatal = new errorClasses.DependencyErrorFatal(
			`Error occurred during route initialization\n${initRoutesError instanceof Error ? initRoutesError.message : String(initRoutesError)}`,
			{
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				originalError: initRoutesError,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(initRoutesErrorFatal);
		processError(initRoutesErrorFatal);
		throw initRoutesErrorFatal;
	}
}
