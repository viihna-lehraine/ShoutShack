import express, { Router } from 'express';
import { Logger } from './config/logger';
import { initializeTestRoutes } from './routes/testRoutes';
import { initializeStaticRoutes } from './routes/staticRoutes';
import { FeatureFlags } from './config/environmentConfig';
import { environmentVariables } from './config/environmentConfig';
import {
	handleGeneralError,
	validateDependencies
} from './middleware/errorHandler';
import initializeUserRoutes, { UserRoutesModel } from './routes/userRoutes';
import initializeValidationRoutes from './routes/validationRoutes';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss';
import generateConfirmationEmailTemplate from './utils/emailTemplates/confirmationEmailTemplate';
import { getTransporter } from './config/mailer';
import totpUtil from './utils/auth/totpUtil';
import sops from './utils/sops';
import { execSync } from 'child_process';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

interface RouteDependencies {
	app: express.Application;
	logger: Logger;
	featureFlags: FeatureFlags;
	staticRootPath: string;
}

let UserRoutes: UserRoutesModel;

let validator: typeof import('validator');

export async function initializeRoutes({
	app,
	logger,
	featureFlags,
	staticRootPath
}: RouteDependencies): Promise<undefined> {
	try {
		validateDependencies(
			[
				{ name: 'app', instance: app },
				{ name: 'logger', instance: logger },
				{ name: 'featureFlags', instance: featureFlags },
				{ name: 'staticRootPath', instance: staticRootPath }
			],
			logger
		);

		const getDirectoryPath = (): string => process.cwd();

		const secrets = await sops.getSecrets({
			logger,
			execSync,
			getDirectoryPath
		});

		const totpUtilInstance = totpUtil({
			speakeasy,
			QRCode,
			logger
		});

		if (
			featureFlags.loadTestRoutesFlag &&
			environmentVariables.nodeEnv !== 'production'
		) {
			logger.info('Test routes enabled. Initializing test routes.');
			const testRoutes: Router = initializeTestRoutes({
				app,
				logger,
				featureFlags,
				environmentVariables
			});
			app.use('/test', testRoutes);
		} else {
			logger.info('Test routes disabled or running in production.');
		}

		logger.info('Initializing static routes.');
		initializeStaticRoutes(app, staticRootPath, logger);

		// validation routes
		logger.info('Initializing validation routes.');
		initializeValidationRoutes({ logger, validator });

		// user routes
		logger.info('Initializing user routes.');
		initializeUserRoutes({
			logger,
			secrets,
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
	} catch (error) {
		logger.error(
			`FATAL EXCEPTION: Failed to initialize routes: ${error instanceof Error ? error.message : error}`
		);
		handleGeneralError(error, logger);
		throw new Error(
			`Failed to initialize routes: ${error instanceof Error ? error.message : error}`
		);
	}
}
