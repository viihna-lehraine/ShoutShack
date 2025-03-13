// File: server/src/services/mailer.ts

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	host: 'smtp.protonmail.ch', // Change to your SMTP provider
	port: 465,
	secure: true, // Use `true` for port 465, `false` for other ports
	auth: {
		user: process.env.EMAIL_USER, // Set this in your .env file
		pass: process.env.EMAIL_PASS // App password if using Gmail
	}
});

// Function to send email
export async function sendVerificationEmail(email: string, token: string) {
	const verificationLink = `https://yourdomain.com/verify?token=${token}`;

	await transporter.sendMail({
		from: '"ShoutShack" <no-reply@shoutshack.com>', // Change sender info
		to: email,
		subject: 'Verify Your ShoutShack Account',
		text: `Yo, confirm your email: ${verificationLink}`,
		html: `<p>Yo, confirm your email:</p><a href="${verificationLink}">Click here to verify</a>`
	});
}
