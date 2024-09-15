import nodemailer, { Transporter } from 'nodemailer';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export interface MailerSecrets {
	readonly EMAIL_HOST: string;
	readonly EMAIL_PORT: number;
	readonly EMAIL_SECURE: boolean;
	readonly SMTP_TOKEN: string;
}

export interface MailerDependencies {
	readonly nodemailer: typeof nodemailer;
	readonly getSecrets: () => Promise<MailerSecrets>;
	readonly emailUser: string;
	readonly logger: Logger;
}

async function createTransporter({
	nodemailer,
	getSecrets,
	emailUser,
	logger
}: MailerDependencies): Promise<Transporter> {
	try {
		validateDependencies(
			[
				{ name: 'nodemailer', instance: nodemailer },
				{ name: 'getSecrets', instance: getSecrets },
				{ name: 'emailUser', instance: emailUser },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

		const secrets: MailerSecrets = await getSecrets();

		return nodemailer.createTransport({
			host: secrets.EMAIL_HOST,
			port: secrets.EMAIL_PORT,
			secure: secrets.EMAIL_SECURE,
			auth: {
				user: emailUser,
				pass: secrets.SMTP_TOKEN
			}
		});
	} catch (depError) {
		const dependency: string = 'createTransporter()';
		const dependencyError = new errorClasses.DependencyErrorRecoverable(
			dependency,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(dependencyError, logger);
		processError(dependencyError, logger || console);
		throw dependencyError;
	}
}

let transporter: Transporter | null = null;

export async function getTransporter(deps: MailerDependencies): Promise<Transporter> {
	try {
		validateDependencies(
			[
				{ name: 'deps', instance: deps },
				{ name: 'deps.nodemailer', instance: deps.nodemailer },
				{ name: 'deps.getSecrets', instance: deps.getSecrets },
				{ name: 'deps.emailUser', instance: deps.emailUser },
				{ name: 'deps.logger', instance: deps.logger }
			],
			deps.logger || console
		)
		if (!transporter) {
			transporter = await createTransporter(deps);
		}
		return transporter;
	} catch (depError) {
		const dependency: string = 'getTransporter()';
		const dependencyError = new errorClasses.DependencyErrorRecoverable(
			dependency,
			{ exposeToClient: false }
		);
		processError(dependencyError, deps.logger || console);
		throw dependencyError;
	}
}
