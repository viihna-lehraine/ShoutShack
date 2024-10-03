import { Transporter } from 'nodemailer';
import { validateDependencies } from '../utils/helpers';
import { MailerServiceDeps } from '../index/interfaces/serviceDeps';
import { MailerServiceInterface } from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class MailerService implements MailerServiceInterface {
	private static instance: MailerService | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private envConfig = ServiceFactory.getEnvConfigService();
	private secrets = ServiceFactory.getVaultService();
	private transporter: Transporter | null = null;

	private constructor(
		private nodemailer: typeof import('nodemailer'),
		private emailUser: string
	) {}

	public static getInstance(deps: MailerServiceDeps): MailerService {
		deps.validateDependencies(
			[
				{ name: 'nodemailer', instance: deps.nodemailer },
				{ name: 'emailUser', instance: deps.emailUser }
			],
			ServiceFactory.getLoggerService()
		);

		if (!MailerService.instance) {
			MailerService.instance = new MailerService(
				deps.nodemailer,
				deps.emailUser
			);
		}

		return MailerService.instance;
	}

	public validateMailerDependencies(): void {
		validateDependencies(
			[
				{ name: 'nodemailer', instance: this.nodemailer },
				{ name: 'emailUser', instance: this.emailUser }
			],
			this.logger
		);
	}

	public async createMailTransporter(): Promise<Transporter> {
		try {
			this.validateMailerDependencies();

			const smtpToken = this.secrets.retrieveSecret(
				'SMTP_TOKEN',
				secret => secret
			);

			if (typeof smtpToken !== 'string') {
				const smtpTokenError =
					new this.errorHandler.ErrorClasses.ConfigurationError(
						'Invalid SMTP token'
					);
				this.errorLogger.logError(smtpTokenError.message);
				this.errorHandler.handleError({ error: smtpTokenError });
				throw smtpTokenError;
			}

			const transportOptions: SMTPTransport.Options = {
				host: this.envConfig.getEnvVariable('emailHost'),
				port: this.envConfig.getEnvVariable('emailPort'),
				secure: this.envConfig.getEnvVariable('emailSecure'),
				auth: {
					user: this.emailUser,
					pass: smtpToken
				}
			};

			return this.nodemailer.createTransport(transportOptions);
		} catch (depError) {
			const dependencyError =
				new this.errorHandler.ErrorClasses.DependencyErrorRecoverable(
					`Unable to create transporter for Mailer Service\n${depError instanceof Error ? depError.message : 'Unknown error'};`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(dependencyError.message);
			this.errorHandler.handleError({
				error:
					dependencyError ||
					depError ||
					Error ||
					'Unable to create transporter for Mailer Service'
			});
			throw dependencyError;
		}
	}

	public async getTransporter(): Promise<Transporter> {
		try {
			this.validateMailerDependencies();

			if (!this.transporter) {
				this.transporter = await this.createMailTransporter();
			}
			return this.transporter!;
		} catch (depError) {
			const dependencyError =
				new this.errorHandler.ErrorClasses.DependencyErrorRecoverable(
					`Unable to retrieve transporter for Mailer Service\n${depError instanceof Error ? depError.message : 'Unknown error'};`,
					{
						dependency: 'getTransporter()',
						originalError: depError,
						exposeToClient: false
					}
				);
			this.logger.logError(dependencyError.message);
			this.errorHandler.handleError({
				error: dependencyError || depError || Error || 'Unknown error'
			});
			throw dependencyError;
		}
	}

	public async shutdown(): Promise<void> {
		try {
			if (this.transporter) {
				this.transporter.close();
				MailerService.instance = null;
				this.logger.info('Mailer service transporter closed.');
			}
		} catch (error) {
			this.errorLogger.logError(
				`Error shutting down Mailer service: ${error instanceof Error ? error.message : error}`
			);
		}
	}
}
