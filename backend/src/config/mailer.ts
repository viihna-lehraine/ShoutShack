import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from './logger';
import { handleGeneralError, validateDependencies } from '../middleware/errorHandler';

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

// Create a transporter instance
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
	} catch (error) {
		handleGeneralError(error, logger || console);
		throw error;
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
	} catch (error) {
		handleGeneralError(error, deps.logger || console);
		throw error;
	}
}
