import nodemailer, { Transporter } from 'nodemailer';

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
}

// Create a transporter instance
async function createTransporter({
	nodemailer,
	getSecrets,
	emailUser
}: MailerDependencies): Promise<Transporter> {
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
}

// Singleton pattern to ensure only one instance of the transporter is created
let transporter: Transporter | null = null;

export async function getTransporter(deps: MailerDependencies): Promise<Transporter> {
	if (!transporter) {
		transporter = await createTransporter(deps);
	}
	return transporter;
}

