import { Transporter } from 'nodemailer';
import { validateDependencies } from '../utils/helpers';
import {
	AppLoggerServiceInterface,
	ConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	MailerServiceDeps,
	MailerServiceInterface,
	SecretsStoreInterface
} from '../index/interfaces';
import { ServiceFactory } from '../index/factory';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import {} from './config';

export class MailerService implements MailerServiceInterface {
	private static instance: MailerService | null = null;
	private transporter: Transporter | null = null;
	private logger: AppLoggerServiceInterface;
	private errorLogger: ErrorLoggerServiceInterface;
	private errorHandler: ErrorHandlerServiceInterface;
	private configService: ConfigServiceInterface;
	private secrets: SecretsStoreInterface;

	private constructor(
		private nodemailer: typeof import('nodemailer'),
		private emailUser: string
	) {
		this.logger = ServiceFactory.getLoggerService();
		this.errorLogger = ServiceFactory.getErrorLoggerService();
		this.errorHandler = ServiceFactory.getErrorHandlerService();
		this.configService = ServiceFactory.getConfigService();
		this.secrets = ServiceFactory.getSecretsStore();
	}

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

			const smtpToken = this.secrets.retrieveSecrets('SMTP_TOKEN');

			let smtpTokenValue: string;
			if (typeof smtpToken === 'string') {
				smtpTokenValue = smtpToken;
			} else if (
				smtpToken &&
				typeof smtpToken === 'object' &&
				smtpToken.SMTP_TOKEN
			) {
				smtpTokenValue = smtpToken.SMTP_TOKEN;
			} else {
				const dependencyError =
					new this.errorHandler.ErrorClasses.DependencyErrorRecoverable(
						'Unable to retrieve a valid SMTP token for Mailer Service transport creation',
						{ exposeToClient: false }
					);
				this.errorLogger.logError(dependencyError.message);
				this.errorHandler.handleError({
					error: dependencyError || Error || 'Secret not found'
				});
				throw dependencyError;
			}

			const transportOptions: SMTPTransport.Options = {
				host: this.configService.getEnvVariable('emailHost'),
				port: this.configService.getEnvVariable('emailPort'),
				secure: this.configService.getEnvVariable('emailSecure'),
				auth: {
					user: this.emailUser,
					pass: smtpTokenValue
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
}
