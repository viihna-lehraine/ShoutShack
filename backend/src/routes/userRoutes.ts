import express, { Request, Response, Router } from 'express';
import { execSync } from 'child_process';
import path from 'path';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss';
import { Logger } from '../config/logger';
import nodemailer from 'nodemailer';
import sops from '../utils/sops';
import createEmail2FAUtil from '../utils/auth/email2FAUtil';
import createTOTPUtil from '../utils/auth/totpUtil';
import generateConfirmationEmailTemplate from '../utils/emailTemplates/confirmationEmailTemplate';
import { getTransporter } from '../config/mailer';
import { environmentVariables } from 'src/config/environmentConfig';

interface UserSecrets {
	JWT_SECRET: string;
	PEPPER: string;
}

interface UserModel {
	validatePassword: (password: string) => boolean;
	findOne: (criteria: object) => Promise<UserInstance | null>;
	create: (user: Partial<UserInstance>) => Promise<UserInstance>;
}

interface UserInstance {
	id: string;
	userid: number;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken: string | null;
	resetPasswordExpires: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2'),
		secrets: UserSecrets
	) => Promise<boolean>;
	save: () => Promise<void>;
}

interface UserRouteDependencies {
	logger: Logger;
	secrets: UserSecrets;
	User: UserModel;
	argon2: typeof argon2;
	jwt: typeof jwt;
	axios: typeof axios;
	bcrypt: typeof bcrypt;
	uuidv4: typeof uuidv4;
	xss: typeof xss;
	generateConfirmationEmailTemplate: typeof generateConfirmationEmailTemplate;
	getTransporter: typeof getTransporter;
	totpUtil: ReturnType<typeof createTOTPUtil>;
}

const port = environmentVariables.serverPort;

function getDirectoryPath(): string {
	return path.resolve(process.cwd());
}

export default function createUserRoutes({
	logger,
	secrets,
	User,
	argon2,
	jwt,
	axios,
	bcrypt,
	uuidv4,
	xss,
	generateConfirmationEmailTemplate,
	getTransporter,
	totpUtil
}: UserRouteDependencies): Router {
	const router = express.Router();

	// Password strength checker
	const checkPasswordStrength = (password: string): boolean => {
		const { score } = zxcvbn(password);
		return score >= 3;
	};

	// Register
	router.post('/register', async (req: Request, res: Response) => {
		try {
			const { username, email, password, confirmPassword } = req.body;

			// Sanitize inputs
			const sanitizedUsername = xss(username);
			const sanitizedEmail = xss(email);
			const sanitizedPassword = xss(password);

			if (sanitizedPassword !== confirmPassword) {
				logger.info('Registration failure: passwords do not match');
				return res.status(400).json({
					password: 'Registration failure: passwords do not match'
				});
			}

			if (!User.validatePassword(sanitizedPassword)) {
				logger.info(
					'Registration failure: passwords do not meet complexity requirements'
				);
				return res.status(400).json({
					password:
						'Registration failure: password does not meet complexity requirements'
				});
			}

			if (!checkPasswordStrength(sanitizedPassword)) {
				logger.info('Registration failure: password is too weak');
				return res.status(400).json({
					password: 'Registration failure: password is too weak'
				});
			}

			const pwnedResponse = await axios.get(
				`https://api.pwnedpasswords.com/range/${sanitizedPassword.substring(0, 5)}`
			);
			const pwnedList = pwnedResponse.data
				.split('\n')
				.map((p: string) => p.split(':')[0]);
			if (
				pwnedList.includes(sanitizedPassword.substring(5).toUpperCase())
			) {
				logger.warn(
					'Registration warning: password has been exposed in a data breach'
				);
				return res.status(400).json({
					password:
						'Registration warning: password has been exposed in a data breach'
				});
			}

			const existingUser = await User.findOne({
				where: { email: sanitizedEmail }
			});
			if (existingUser) {
				logger.info('Registration failure: email already exists');
				return res.status(400).json({
					email: 'Registration failure: email already exists'
				});
			}

			const hashedPassword = await argon2.hash(
				sanitizedPassword + secrets.PEPPER,
				{
					type: argon2.argon2id
				}
			);
			const newUser = await User.create({
				id: uuidv4(),
				username: sanitizedUsername,
				password: hashedPassword,
				email: sanitizedEmail,
				isAccountVerified: false,
				resetPasswordToken: null,
				resetPasswordExpires: null,
				isMfaEnabled: false,
				creationDate: new Date()
			});

			// Generate a confirmation token
			const confirmationToken = jwt.sign(
				{ id: newUser.id },
				secrets.JWT_SECRET,
				{ expiresIn: '1d' }
			);
			const confirmationUrl = `http://localhost:${port}/api/users/confirm/${confirmationToken}`;

			// Send confirmation email
			const mailOptions = {
				from: environmentVariables.emailUser,
				to: newUser.email,
				subject: 'Guestbook - Account Confirmation',
				html: generateConfirmationEmailTemplate(
					newUser.username,
					confirmationUrl
				)
			};

			const transporter = await getTransporter({
				nodemailer,
				getSecrets: () =>
					sops.getSecrets({ logger, execSync, getDirectoryPath }),
				emailUser: environmentVariables.emailUser as string
			});

			await transporter.sendMail(mailOptions);

			logger.info('User registration complete');
			return res.json({
				message:
					'Registration successful. Please check your email to confirm your account.'
			});
		} catch (err) {
			logger.error(
				`User Registration: server error: ${err instanceof Error ? err.message : String(err)}`
			);
			return res
				.status(500)
				.json({ error: 'User registration: server error' });
		}
	});

	// Login
	router.post('/login', async (req: Request, res: Response) => {
		try {
			const { email, password } = req.body;

			// sanitize inputs
			const sanitizedEmail = xss(email);
			const sanitizedPassword = xss(password);

			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});

			if (!user) {
				logger.info('400 - User not found');
				return res.status(400).json({ email: 'User not found' });
			}

			const isMatch = await argon2.verify(
				user.password,
				sanitizedPassword + secrets.PEPPER
			);

			if (isMatch) {
				const payload = { id: user.userid, username: user.username };
				const token = jwt.sign(payload, secrets.JWT_SECRET, {
					expiresIn: '1h'
				});

				return res.json({ success: true, token: `Bearer ${token}` });
			} else {
				return res.status(400).json({ password: 'Incorrect password' });
			}
		} catch (err) {
			logger.error(
				`Login - server error: ${err instanceof Error ? err.message : String(err)}`
			);
			return res.status(500).json({ error: 'Login - Server error' });
		}
	});

	// Password Recovery (simplified)
	router.post('/recover-password', async (req: Request, res: Response) => {
		const { email } = req.body;

		// Sanitize inputs
		const sanitizedEmail = xss(email);

		try {
			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});
			if (!user) {
				logger.error('Recover password: User not found');
				return res.status(404).json({ email: 'User not found' });
			}
			// Generate a token (customize this later)
			const token = await bcrypt.genSalt(25);

			// Store the token in the database (simplified for now)
			user.resetPasswordToken = token;
			user.resetPasswordExpires = new Date(Date.now() + 1800000); // 30 min
			await user.save();

			// Send password reset email
			logger.info(`Password reset link sent to user ${user.email}`);
			return res.json({
				message: `Password reset link sent to ${user.email}`
			});
		} catch (err) {
			logger.error(
				`Password Recovery - Server error: ${err instanceof Error ? err.message : String(err)}`
			);
			return res
				.status(500)
				.json({ error: 'Password Recovery - Server error' });
		}
	});

	// Route for TOTP secret generation
	router.post('/generate-totp', async (req: Request, res: Response) => {
		try {
			const { base32, otpauth_url } = totpUtil.generateTOTPSecret();
			const qrCodeUrl = await totpUtil.generateQRCode(otpauth_url);
			return res.json({ secret: base32, qrCodeUrl });
		} catch (err) {
			logger.error(
				`Error generating TOTP secret: ${err instanceof Error ? err.message : String(err)}`
			);
			return res.status(500).json({ error: 'Internal server error' });
		}
	});

	// Route to verify TOTP tokens
	router.post('/verify-totp', async (req: Request, res: Response) => {
		const { token, secret } = req.body;

		try {
			// Verify TOTP token using the secret
			const isTOTPTokenValid = totpUtil.verifyTOTPToken(secret, token);
			return res.json({ isTOTPTokenValid });
		} catch (err) {
			logger.error(
				`Error verifying TOTP token: ${err instanceof Error ? err.message : String(err)}`
			);
			return res.status(500).json({ error: 'Internal server error' });
		}
	});

	// Route to generate and send 2FA codes by email
	router.post('/generate-2fa', async (req: Request, res: Response) => {
		const { email } = req.body;

		// Sanitize email input
		const sanitizedEmail = xss(email);

		try {
			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});

			if (!user) {
				logger.error('Generate 2FA: user not found');
				return res
					.status(404)
					.json({ error: 'Generate 2FA: user not found' });
			}

			const email2FAUtil = await createEmail2FAUtil({
				logger,
				getSecrets: () =>
					sops.getSecrets({ logger, execSync, getDirectoryPath }),
				bcrypt,
				jwt
			});

			const { email2FAToken } = await email2FAUtil.generateEmail2FACode();

			// Save 2FA token and expiration in user's record
			user.resetPasswordToken = email2FAToken;
			user.resetPasswordExpires = new Date(Date.now() + 30 * 60000); // 30 min
			await user.save(); // Save user data with the new 2FA token and expiration

			// Send the 2FA code to user's email
			const transporter = await getTransporter({
				nodemailer,
				getSecrets: () =>
					sops.getSecrets({ logger, execSync, getDirectoryPath }),
				emailUser: environmentVariables.emailUser as string
			});

			await transporter.sendMail({
				to: sanitizedEmail,
				subject: 'Guestbook - Your Login Code',
				text: `Your 2FA code is ${email2FAToken}`
			});

			return res.json({ message: '2FA code sent to email' });
		} catch (err) {
			logger.error(
				`Error generating 2FA code: ${err instanceof Error ? err.message : String(err)}`
			);
			return res.status(500).json({
				error: 'Generate 2FA: internal server error'
			});
		}
	});

	// Route to verify email 2FA code
	router.post('/verify-2fa', async (req: Request, res: Response) => {
		const { email, email2FACode } = req.body;

		// Sanitize inputs
		const sanitizedEmail = xss(email);

		try {
			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});
			if (!user) {
				logger.error('Verify 2FA: user not found');
				return res
					.status(404)
					.json({ error: 'Verify 2FA: User not found' });
			}

			const resetPasswordToken = user.resetPasswordToken || '';

			const email2FAUtil = await createEmail2FAUtil({
				logger,
				getSecrets: () =>
					sops.getSecrets({ logger, execSync, getDirectoryPath }),
				bcrypt,
				jwt
			});

			const isEmail2FACodeValid = await email2FAUtil.verifyEmail2FACode(
				resetPasswordToken,
				email2FACode
			);
			if (!isEmail2FACodeValid) {
				logger.error('Invalid or expired 2FA code');
				return res
					.status(400)
					.json({ error: 'Invalid or expired 2FA code' });
			}

			return res.json({ message: '2FA code verified successfully' });
		} catch (err) {
			logger.error(
				`Error verifying 2FA code: ${err instanceof Error ? err.message : String(err)}`
			);
			return res.status(500).json({ error: 'Internal server error' });
		}
	});

	return router;
}
