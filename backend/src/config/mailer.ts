import nodemailer, { Transporter } from 'nodemailer';

export interface MailerSecrets {
	EMAIL_HOST: string;
	EMAIL_PORT: number;
	EMAIL_SECURE: boolean;
	SMTP_TOKEN: string;
}

export interface MailerDependencies {
	nodemailer: typeof nodemailer;
	getSecrets: () => Promise<MailerSecrets>;
	emailUser: string;
}

async function createTransporter({
	nodemailer,
	getSecrets,
	emailUser
}: MailerDependencies): Promise<Transporter> {
	const secrets: MailerSecrets = await getSecrets();

	const transporter = nodemailer.createTransport({
		host: secrets.EMAIL_HOST,
		port: secrets.EMAIL_PORT,
		secure: secrets.EMAIL_SECURE,
		auth: {
			user: emailUser,
			pass: secrets.SMTP_TOKEN
		}
	});

	return transporter;
}

let transporter: Transporter | null = null;

export async function getTransporter(deps: MailerDependencies): Promise<Transporter> {
	if (!transporter) {
		transporter = await createTransporter(deps);
	}
	return transporter;
}

