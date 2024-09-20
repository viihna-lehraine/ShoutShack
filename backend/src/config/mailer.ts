import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '../config/configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/validateDependencies';

export interface MailerSecrets {
	readonly EMAIL_HOST: string;
	readonly EMAIL_PORT: number;
	readonly EMAIL_SECURE: boolean;
	readonly SMTP_TOKEN: string;
}

export interface MailerDependencies {
	readonly nodemailer: typeof nodemailer;
	readonly emailUser: string;
}

async function createTransporter({
	nodemailer,
	emailUser
}: MailerDependencies): Promise<Transporter> {
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();
	const secrets = configService.getSecrets() as MailerSecrets;

	try {
		validateDependencies(
			[
				{ name: 'nodemailer', instance: nodemailer },
				{ name: 'emailUser', instance: emailUser }
			],
			appLogger || console
		);

		if (!configService.getSecrets()) {
			const loadSecretsError = new errorClasses.ConfigurationError(
				`Error occurred when retrieving secrets`,
				{
					statusCode: 404,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(loadSecretsError, appLogger || console);
			processError(loadSecretsError, appLogger || console);
			throw loadSecretsError;
		}

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
			{
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(dependencyError, appLogger);
		processError(dependencyError, appLogger || console);
		throw dependencyError;
	}
}

let transporter: Transporter | null = null;

export async function getTransporter(deps: MailerDependencies): Promise<Transporter> {
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();

	try {
		validateDependencies(
			[
				{ name: 'deps', instance: deps },
				{ name: 'deps.nodemailer', instance: deps.nodemailer },
				{ name: 'deps.emailUser', instance: deps.emailUser },
			],
			appLogger || console
		)
		if (!transporter) {
			transporter = await createTransporter(deps);
		}
		return transporter;
	} catch (depError) {
		const dependency: string = 'getTransporter()';
		const dependencyError = new errorClasses.DependencyErrorRecoverable(
			`Fatal error occured when attempting to execute ${dependency}: ${depError instanceof Error ? depError.message : 'Unknown error'};`,
			{
				dependency,
				originalError: depError,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(dependencyError, appLogger);
		processError(dependencyError, appLogger || console);
		throw dependencyError;
	}
}
