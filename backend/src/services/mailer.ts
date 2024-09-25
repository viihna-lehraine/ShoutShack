import { Transporter } from 'nodemailer';
import { validateDependencies } from '../utils/helpers';
import { ConfigService } from './configService';
import {
	AppLoggerInterface,
	EnvVariableTypes,
	ErrorHandlerInterface,
	MailerServiceDeps,
	MailerServiceInterface
} from '../index/interfaces';
import { envSecretsStore } from '../environment/envSecrets';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export class MailerService implements MailerServiceInterface {
	private static instance: MailerService | null = null;
	private transporter: Transporter | null = null;
	private logger: AppLoggerInterface;
	private errorLogger: AppLoggerInterface;
	private envVariables: EnvVariableTypes;
	private errorHandler: ErrorHandlerInterface;

	private constructor(
		private nodemailer: typeof import('nodemailer'),
		private emailUser: string,
		logger: AppLoggerInterface,
		errorLogger: AppLoggerInterface,
		configService: ConfigService,
		errorHandler: ErrorHandlerInterface
	) {
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.envVariables = configService.getEnvVariables();
		this.errorHandler = errorHandler;
	}

	public static getInstance(deps: MailerServiceDeps): MailerService {
		deps.validateDependencies(
			[
				{ name: 'nodemailer', instance: deps.nodemailer },
				{ name: 'emailUser', instance: deps.emailUser }
			],
			deps.logger
		);

		if (!MailerService.instance) {
			MailerService.instance = new MailerService(
				deps.nodemailer,
				deps.emailUser,
				deps.logger,
				deps.errorLogger,
				deps.configService,
				deps.errorHandler
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

	// Create a new transporter instance
	public async createMailTransporter(): Promise<Transporter> {
		try {
			this.validateMailerDependencies();

			const smtpToken = envSecretsStore.retrieveSecret('SMTP_TOKEN');

			if (!smtpToken) {
				const dependencyError =
					new this.errorHandler.ErrorClasses.DependencyErrorRecoverable(
						'Unable to retrieve SMTP token for Mailer Service transport creation',
						{ exposeToClient: false }
					);
				this.errorLogger.logError(dependencyError.message);
				this.errorHandler.handleError({
					error: dependencyError || Error || 'Secret not found'
				});
				throw dependencyError;
			}

			const transportOptions: SMTPTransport.Options = {
				host: this.envVariables.emailHost,
				port: this.envVariables.emailPort,
				secure: this.envVariables.emailSecure,
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
}
