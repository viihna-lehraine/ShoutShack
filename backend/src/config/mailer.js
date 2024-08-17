import nodemailer from 'nodemailer';
import getSecrets from './secrets.js';

async function createTransporter() {
	const secrets = await getSecrets();

	const transporter = nodemailer.createTransport({
		host: secrets.EMAIL_HOST,
		port: secrets.EMAIL_PORT,
		secure: secrets.EMAIL_SECURE,
		auth: {
			user: process.env.EMAIL_USER,
			pass: secrets.SMTP_TOKEN,
		},
	});

	return transporter;
}

async function getTransporter() {
	if (!transporter) {
		transporter = await createTransporter();
	}
	return transporter;
}

export { createTransporter, getTransporter };
