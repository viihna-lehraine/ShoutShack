import argon2 from 'argon2';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss';
import totpUtil from './auth/totpUtil';
import { environmentVariables, FeatureFlags } from './config/environmentConfig';
import { Logger } from './utils/logger';
import { getTransporter } from './config/mailer';
import { initializeStaticRoutes } from './routes/staticRoutes';
import { initializeTestRoutes } from './routes/testRoutes';
import initializeUserRoutes, { UserRoutesModel } from './routes/userRoutes';
import initializeValidationRoutes from './routes/validationRoutes';
import generateConfirmationEmailTemplate from './templates/confirmationEmailTemplate';
import { processError } from './utils/processError';
import sops from './utils/sops';
import { validateDependencies } from './utils/validateDependencies';

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
		processError(error, logger);
		throw new Error(
			`Failed to initialize routes: ${error instanceof Error ? error.message : error}`
		);
	}
}
