import nodemailer, { Transporter } from 'nodemailer';
import getSecrets from './sops';

interface MailerSecrets {
	EMAIL_HOST: string;
	EMAIL_PORT: number;
	EMAIL_SECURE: boolean;
	SMTP_TOKEN: string;
}

async function createTransporter(): Promise<Transporter> {
	const secrets: MailerSecrets = await getSecrets.getSecrets();

	let transporter = nodemailer.createTransport({
		host: secrets.EMAIL_HOST,
		port: secrets.EMAIL_PORT,
		secure: secrets.EMAIL_SECURE,
		auth: {
			user: process.env.EMAIL_USER as string,
			pass: secrets.SMTP_TOKEN
		}
	});

	return transporter;
}

let transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
	if (!transporter) {
		transporter = await createTransporter();
	}
	return transporter;
}

export { createTransporter, getTransporter };
