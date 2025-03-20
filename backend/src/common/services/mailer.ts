// File: backend/src/common/services/mailer.ts

import nodemailer from 'nodemailer';
import { env } from '../../env/load.js';

const transporter = nodemailer.createTransport({
	host: env.EMAIL_HOST,
	port: env.EMAIL_PORT,
	secure: env.EMAIL_SECURE,
	auth: {
		user: env.EMAIL_USER,
		pass: env.EMAIL_PASSWORD
	}
});

export async function sendVerificationEmail(email: string, token: string) {
	const verificationLink = `https://yourdomain.com/verify?token=${token}`;

	await transporter.sendMail({
		from: '"ShoutShack" <no-reply@shoutshack.com>',
		to: email,
		subject: 'Verify Your ShoutShack Account',
		text: `Yo, confirm your email: ${verificationLink}`,
		html: `<p>Yo, confirm your email:</p><a href="${verificationLink}">Click here to verify</a>`
	});
}
