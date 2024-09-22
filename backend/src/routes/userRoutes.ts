import argon2 from 'argon2';
import axios from 'axios';
import bcrypt from 'bcrypt';
import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss';
import zxcvbn from 'zxcvbn';
import { createEmail2FAUtil } from '../auth/emailMfa';
import { createTOTPUtil } from '../auth/totpMfa';
import { ConfigService } from '../services/configService';
import { hashPassword } from '../auth/hash';
import { getTransporter } from '../services/mailer';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../services/errorLogger';
import { processError } from '../errors/processError';
import { generateConfirmationEmailTemplate } from '../templates/confirmationEmailTemplate';
import { Logger } from '../services/appLogger';
import { validateDependencies } from '../utils/helpers';

export interface UserRoutesModel {
	validatePassword: (password: string, appLogger: Logger) => boolean;
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
		argon2: typeof import('argon2')
	) => Promise<boolean>;
	save: () => Promise<void>;
}

interface UserRouteDependencies {
	UserRoutes: UserRoutesModel;
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

export default function initializeUserRoutes({
	UserRoutes,
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
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();
	const secrets = configService.getSecrets();

	const port = configService.getEnvVariables().serverPort;

	validateDependencies(
		[
			{ name: 'UserRoutes', instance: UserRoutes },
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
		appLogger || console
	);

	if (!secrets || !secrets.PEPPER || !secrets.JWT_SECRET) {
		const userRoutesError = new errorClasses.ConfigurationError(
			'Error occurred when retrieving secrets',
			{
				statusCode: 404,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(userRoutesError, appLogger || console);
		processError(userRoutesError, appLogger || console);
		throw userRoutesError;
	}

	const checkPasswordStrength = (password: string): boolean => {
		const { score } = zxcvbn(password);
		return score >= 3;
	};

	// register route
	router.post('/register', async (req: Request, res: Response) => {
		try {
			const { username, email, password, confirmPassword } = req.body;

			const sanitizedUsername = xss(username);
			const sanitizedEmail = xss(email);
			const sanitizedPassword = xss(password);

			if (sanitizedPassword !== confirmPassword) {
				appLogger.debug('Registration failure: passwords do not match');
				return res.status(400).json({
					password: 'Registration failure: passwords do not match'
				});
			}

			if (!UserRoutes.validatePassword(sanitizedPassword, appLogger)) {
				appLogger.debug(
					'Registration failure: passwords do not meet complexity requirements'
				);
				return res.status(400).json({
					password:
						'Registration failure: password does not meet complexity requirements'
				});
			}

			if (!checkPasswordStrength(sanitizedPassword)) {
				appLogger.debug('Registration failure: password is too weak');
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
				appLogger.warn(
					'Registration warning: password exposed in a breach'
				);
				return res.status(400).json({
					password:
						'Warning! This password has been exposed in a data breach.'
				});
			}

			const existingUser = await UserRoutes.findOne({
				where: { email: sanitizedEmail }
			});

			if (existingUser) {
				appLogger.info('Registration failure: email already exists');
				return res.status(400).json({
					email: 'Registration failure: email already exists'
				});
			}

			const hashedPassword = await hashPassword({
				password: sanitizedPassword
			});

			const newUser = await UserRoutes.create({
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

			// send confirmation email
			const mailOptions = {
				from: configService.getEnvVariables().emailUser,
				to: newUser.email,
				subject: 'Guestbook - Account Confirmation',
				html: generateConfirmationEmailTemplate(
					newUser.username,
					confirmationUrl
				)
			};

			const transporter = await getTransporter({
				nodemailer,
				emailUser: configService.getEnvVariables().emailUser as string
			});

			await transporter.sendMail(mailOptions);

			appLogger.info(
				`User registration for ${newUser.username} complete. Confirmation email sent.`
			);
			return res.json({
				message: 'Account registered! Please confirm via email.'
			});
		} catch (err) {
			processError(err, appLogger || console);
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

			const user = await UserRoutes.findOne({
				where: { email: sanitizedEmail }
			});

			if (!user) {
				appLogger.debug('400 - User not found');
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
			processError(err, appLogger || console);
			return res.status(500).json({ error: 'Login - Server error' });
		}
	});

	// password recovery route
	router.post('/recover-password', async (req: Request, res: Response) => {
		const { email } = req.body;

		const sanitizedEmail = xss(email);

		try {
			const user = await UserRoutes.findOne({
				where: { email: sanitizedEmail }
			});
			if (!user) {
				appLogger.error('Recover password: User not found');
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
				emailUser: configService.getEnvVariables().emailUser as string
			});

			await transporter.sendMail({
				to: sanitizedEmail,
				subject: 'Guestbook - Password Reset',
				text: `You have requested a password reset. Please use the following token: ${token}. This token will expire in 30 minutes.`
			});

			appLogger.debug(`Password reset link sent to ${user.email}`);
			return res.json({
				message: `Password reset link sent to ${user.email}`
			});
		} catch (err) {
			processError(err, appLogger || console);
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
			processError(err, appLogger || console);
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
			processError(err, appLogger || console);
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
			const user = await UserRoutes.findOne({
				where: { email: sanitizedEmail }
			});

			if (!user) {
				appLogger.error('Generate 2FA: User not found');
				return res
					.status(404)
					.json({ error: 'Generate 2FA: User not found' });
			}

			const email2FAUtil = await createEmail2FAUtil({
				bcrypt,
				jwt
			});

			const { email2FAToken } = await email2FAUtil.generateEmail2FACode();

			user.resetPasswordToken = email2FAToken;
			user.resetPasswordExpires = new Date(Date.now() + 30 * 60000); // 30 minutes
			await user.save();

			const transporter = await getTransporter({
				nodemailer,
				emailUser: configService.getEnvVariables().emailUser as string
			});

			await transporter.sendMail({
				to: sanitizedEmail,
				subject: 'Guestbook - Your Login Code',
				text: `Your 2FA code is ${email2FAToken}`
			});

			return res.json({ message: '2FA code sent to email' });
		} catch (err) {
			processError(err, appLogger || console);
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
			const user = await UserRoutes.findOne({
				where: { email: sanitizedEmail }
			});
			if (!user) {
				appLogger.error('Verify 2FA: User not found');
				return res
					.status(404)
					.json({ error: 'Verify 2FA: User not found' });
			}

			const resetPasswordToken = user.resetPasswordToken || '';

			const email2FAUtil = await createEmail2FAUtil({
				bcrypt,
				jwt
			});

			const isEmail2FACodeValid = await email2FAUtil.verifyEmail2FACode(
				resetPasswordToken,
				email2FACode
			);

			if (!isEmail2FACodeValid) {
				appLogger.error('Invalid or expired 2FA code');
				return res
					.status(400)
					.json({ error: 'Invalid or expired 2FA code' });
			}

			return res.json({ message: '2FA code verified successfully' });
		} catch (err) {
			processError(err, appLogger || console);
			return res.status(500).json({ error: 'Internal server error' });
		}
	});

	return router;
}
