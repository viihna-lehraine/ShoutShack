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
import { environmentVariables } from '../config/environmentConfig';
import {
	handleGeneralError,
	validateDependencies
} from '../middleware/errorHandler';
import { hashPassword } from '../config/hashConfig';

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
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'secrets', instance: secrets },
				{ name: 'User', instance: User },
				{ name: 'argon2', instance: argon2 },
				{ name: 'jwt', instance: jwt },
				{ name: 'axios', instance: axios },
				{ name: 'bcrypt', instance: bcrypt },
				{ name: 'uuidv4', instance: uuidv4 },
				{ name: 'xss', instance: xss },
				{
					name: 'generateConfirmationEmailTemplate',
					instance: generateConfirmationEmailTemplate
				},
				{ name: 'getTransporter', instance: getTransporter },
				{ name: 'totpUtil', instance: totpUtil }
			],
			logger
		);
	} catch (error) {
		handleGeneralError(error as Error, logger || console);
		throw error;
	}

	const router = express.Router();

	const checkPasswordStrength = (password: string): boolean => {
		const { score } = zxcvbn(password);
		return score >= 3;
	};

	// Register route
	router.post('/register', async (req: Request, res: Response) => {
		try {
			const { username, email, password, confirmPassword } = req.body;

			const sanitizedUsername = xss(username);
			const sanitizedEmail = xss(email);
			const sanitizedPassword = xss(password);

			if (sanitizedPassword !== confirmPassword) {
				logger.debug('Registration failure: passwords do not match');
				return res.status(400).json({
					password: 'Registration failure: passwords do not match'
				});
			}

			if (!User.validatePassword(sanitizedPassword)) {
				logger.debug(
					'Registration failure: passwords do not meet complexity requirements'
				);
				return res.status(400).json({
					password:
						'Registration failure: password does not meet complexity requirements'
				});
			}

			if (!checkPasswordStrength(sanitizedPassword)) {
				logger.debug('Registration failure: password is too weak');
				return res.status(400).json({
					password: 'Registration failure: password is too weak'
				});
			}

			// check password exposure in breaches
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
					'Registration warning: password exposed in a breach'
				);
				return res.status(400).json({
					password:
						'Warning! This password has been exposed in a data breach.'
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

			const hashedPassword = await hashPassword({
				password: sanitizedPassword,
				secrets,
				logger
			});

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
				emailUser: environmentVariables.emailUser as string,
				logger
			});

			await transporter.sendMail(mailOptions);

			logger.info(
				`User registration for ${newUser.username} complete. Confirmation email sent.`
			);
			return res.json({
				message: 'Account registered! Please confirm via email.'
			});
		} catch (err) {
			handleGeneralError(err, logger || console);
			return res
				.status(500)
				.json({ error: 'Registration failed. Please try again.' });
		}
	});

	// login route
	router.post('/login', async (req: Request, res: Response) => {
		try {
			const { email, password } = req.body;

			const sanitizedEmail = xss(email);
			const sanitizedPassword = xss(password);

			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});

			if (!user) {
				logger.debug('400 - User not found');
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
			handleGeneralError(err, logger || console);
			return res.status(500).json({ error: 'Login - Server error' });
		}
	});

	// password recovery route
	router.post('/recover-password', async (req: Request, res: Response) => {
		const { email } = req.body;

		const sanitizedEmail = xss(email);

		try {
			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});
			if (!user) {
				logger.error('Recover password: User not found');
				return res.status(404).json({
					email: 'Unable to find your user account. Please try again.'
				});
			}

			const token = await bcrypt.genSalt(25);
			user.resetPasswordToken = token;
			user.resetPasswordExpires = new Date(Date.now() + 1800000); // 30 minutes
			await user.save();

			// send password reset email
			const transporter = await getTransporter({
				nodemailer,
				getSecrets: () =>
					sops.getSecrets({ logger, execSync, getDirectoryPath }),
				emailUser: environmentVariables.emailUser as string,
				logger
			});

			await transporter.sendMail({
				to: sanitizedEmail,
				subject: 'Guestbook - Password Reset',
				text: `You have requested a password reset. Please use the following token: ${token}. This token will expire in 30 minutes.`
			});

			logger.debug(`Password reset link sent to ${user.email}`);
			return res.json({
				message: `Password reset link sent to ${user.email}`
			});
		} catch (err) {
			handleGeneralError(err, logger || console);
			return res.status(500).json({
				error: 'Password recovery failed due to an unknown error. Please try again.'
			});
		}
	});

	// route for TOTP secret generation
	router.post('/generate-totp', async (req: Request, res: Response) => {
		try {
			const { base32, otpauth_url } = totpUtil.generateTOTPSecret();
			const qrCodeUrl = await totpUtil.generateQRCode(otpauth_url);
			return res.json({ secret: base32, qrCodeUrl });
		} catch (err) {
			handleGeneralError(err, logger || console);
			return res.status(500).json({
				error: 'Unable to generate TOTP secret. Please try again.'
			});
		}
	});

	// route for TOTP token verification
	router.post('/verify-totp', async (req: Request, res: Response) => {
		const { token, secret } = req.body;

		try {
			const isTOTPTokenValid = totpUtil.verifyTOTPToken(secret, token);
			return res.json({ isTOTPTokenValid });
		} catch (err) {
			handleGeneralError(err, logger || console);
			return res.status(500).json({
				error: 'Unable to verify TOTP token. Please try again.'
			});
		}
	});

	// route to generate and send 2FA codes via email
	router.post('/generate-2fa', async (req: Request, res: Response) => {
		const { email } = req.body;

		const sanitizedEmail = xss(email);

		try {
			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});

			if (!user) {
				logger.error('Generate 2FA: User not found');
				return res
					.status(404)
					.json({ error: 'Generate 2FA: User not found' });
			}

			const email2FAUtil = await createEmail2FAUtil({
				logger,
				getSecrets: () =>
					sops.getSecrets({ logger, execSync, getDirectoryPath }),
				bcrypt,
				jwt
			});

			const { email2FAToken } = await email2FAUtil.generateEmail2FACode();

			user.resetPasswordToken = email2FAToken;
			user.resetPasswordExpires = new Date(Date.now() + 30 * 60000); // 30 minutes
			await user.save();

			const transporter = await getTransporter({
				nodemailer,
				getSecrets: () =>
					sops.getSecrets({ logger, execSync, getDirectoryPath }),
				emailUser: environmentVariables.emailUser as string,
				logger
			});

			await transporter.sendMail({
				to: sanitizedEmail,
				subject: 'Guestbook - Your Login Code',
				text: `Your 2FA code is ${email2FAToken}`
			});

			return res.json({ message: '2FA code sent to email' });
		} catch (err) {
			handleGeneralError(err, logger || console);
			return res.status(500).json({
				error: 'Generate 2FA: internal server error'
			});
		}
	});

	// route to verify email 2FA code
	router.post('/verify-2fa', async (req: Request, res: Response) => {
		const { email, email2FACode } = req.body;

		const sanitizedEmail = xss(email);

		try {
			const user = await User.findOne({
				where: { email: sanitizedEmail }
			});
			if (!user) {
				logger.error('Verify 2FA: User not found');
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
			handleGeneralError(err, logger || console);
			return res.status(500).json({ error: 'Internal server error' });
		}
	});

	return router;
}
