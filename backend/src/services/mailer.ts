import nodemailer, { Transporter } from 'nodemailer';
import { AppLogger } from './logger';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { validateDependencies } from '../utils/helpers';
import { configService } from './configService';
import { MailerDependencies, MailerSecrets } from '../index/serviceInterfaces';
import { processError } from '../errors/processError';

export class MailerService {
	private transporter: Transporter | null = null;
	private appLogger: AppLogger;

	constructor(
		private nodemailer: typeof import('nodemailer'),
		private emailUser: string,
		appLogger: AppLogger
	) {
		this.appLogger = appLogger;
	}

	// Validate necessary dependencies
	private validateMailerDependencies(): void {
		validateDependencies(
			[
				{ name: 'nodemailer', instance: this.nodemailer },
				{ name: 'emailUser', instance: this.emailUser }
			],
			this.appLogger
		);
	}

	// Create a new transporter instance
	private async createTransporter(): Promise<Transporter> {
		const secrets = configService.getSecrets() as MailerSecrets;

		try {
			this.validateMailerDependencies();

			if (!secrets) {
				const loadSecretsError = new errorClasses.ConfigurationError(
					`Error occurred when retrieving secrets`,
					{
						statusCode: 404,
						severity: ErrorSeverity.FATAL,
						exposeToClient: false
					}
				);
				this.appLogger.logError(loadSecretsError);
				processError(loadSecretsError, this.appLogger);
				throw loadSecretsError;
			}

			return this.nodemailer.createTransport({
				host: secrets.EMAIL_HOST,
				port: secrets.EMAIL_PORT,
				secure: secrets.EMAIL_SECURE,
				auth: {
					user: this.emailUser,
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
			this.appLogger.logError(dependencyError);
			processError(dependencyError, this.appLogger);
			throw dependencyError;
		}
	}

	// Get the transporter instance (singleton)
	public async getTransporter(): Promise<Transporter> {
		try {
			this.validateMailerDependencies();

			if (!this.transporter) {
				this.transporter = await this.createTransporter();
			}
			return this.transporter;
		} catch (depError) {
			const dependency: string = 'getTransporter()';
			const dependencyError = new errorClasses.DependencyErrorRecoverable(
				`Fatal error occurred when attempting to execute ${dependency}: ${depError instanceof Error ? depError.message : 'Unknown error'};`,
				{
					dependency,
					originalError: depError,
					statusCode: 500,
					severity: ErrorSeverity.RECOVERABLE,
					exposeToClient: false
				}
			);
			this.appLogger.logError(dependencyError);
			processError(dependencyError, this.appLogger);
			throw dependencyError;
		}
	}
}
