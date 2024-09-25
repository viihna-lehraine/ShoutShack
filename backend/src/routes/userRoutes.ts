import express, { NextFunction, Request, Response, Router } from 'express';
import zxcvbn from 'zxcvbn';
import { createEmail2FAUtil } from '../auth/emailMfa';
import { hashPassword } from '../auth/hash';
import { mailer } from '../services/mailer';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';
import { UserRoutesInterface } from '../index/interfaces';
import { envSecretsStore } from '../environment/envSecrets';

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
	totpMfa
}: UserRoutesInterface): Router {
	const router = express.Router();
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

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
			{ name: 'totpMfa', instance: totpMfa }
		],
		logger
	);

	const pepper = envSecretsStore.retrieveSecret('PEPPER');
	const jwtSecret = envSecretsStore.retrieveSecret('JWT_SECRET');

	if (!pepper || !jwtSecret) {
		const userRoutesError =
			new errorHandler.ErrorClasses.ConfigurationError(
				'Error occurred when retrieving secrets',
				{ exposeToClient: false }
			);
		errorLogger.logError(userRoutesError.message);
		errorHandler.handleError({
			error:
				userRoutesError ||
				Error ||
				'Error occurred while retrieving secrets'
		});
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
				logger.debug('Registration failure: passwords do not match');
				return res.status(400).json({
					password: 'Registration failure: passwords do not match'
				});
			}

			if (!UserRoutes.validatePassword(sanitizedPassword)) {
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
			const pwnedResponse = await axios.get<string>(
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
						'Warning! This password has been exposed in a data breach. It would be wise to select a different password'
				});
			}

			const existingUser = await UserRoutes.findOne({
				where: { email: sanitizedEmail }
			});

			if (existingUser) {
				logger.info('Registration failure: email already exists');
				return res.status(400).json({
					email: 'Registration failure: email already exists'
				});
			}

			const hashedPassword = await hashPassword(sanitizedPassword);

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

			const jwtSecret = envSecretsStore.retrieveSecret('JWT_SECRET')!;

			const confirmationToken = jwt.sign(newUser.id, jwtSecret, {
				expiresIn: '1d'
			});
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

			const transporter = await mailer.getTransporter();

			await transporter.sendMail(mailOptions);

			envSecretsStore.reEncryptSecret('JWT_SECRET');

			logger.info(
				`User registration for ${newUser.username} complete. Confirmation email sent.`
			);
			return res.json({
				message: 'Account registered! Please confirm via email.'
			});
		} catch (err) {
			errorHandler.handleError({
				error: err || Error || 'User registration failed'
			});
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
				logger.debug('400 - User not found');
				return res.status(400).json({ email: 'User not found' });
			}

			const pepper = envSecretsStore.retrieveSecret('PEPPER')!;
			const jwtSecret = envSecretsStore.retrieveSecret('JWT_SECRET')!;

			const isMatch = await argon2.verify(
				user.password,
				sanitizedPassword + pepper
			);

			if (isMatch) {
				const payload = { id: user.userid, username: user.username };
				const token = jwt.sign(payload, jwtSecret!, {
					expiresIn: '1h'
				});

				envSecretsStore.reEncryptSecrets(['PEPPER', 'JWT_SECRET']);

				return res.json({ success: true, token: `Bearer ${token}` });
			} else {
				return res.status(400).json({ password: 'Incorrect password' });
			}
		} catch (err) {
			errorHandler.handleError({ error: err || Error || 'Login failed' });
			return res.status(500).json({ error: 'Login - Server error' });
		}
	});

	// password recovery route
	router.post(
		'/recover-password',
		async (req: Request, res: Response, next: NextFunction) => {
			const { email } = req.body;

			const sanitizedEmail = xss(email);

			try {
				const user = await UserRoutes.findOne({
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
				const transporter = await mailer.getTransporter();

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
				errorHandler.expressErrorHandler()(
					err as Error,
					req,
					res,
					next
				);
				return res.status(500).json({
					error: 'Password recovery failed due to an unknown error. Please try again.'
				});
			}
		}
	);

	router.post(
		'/generate-totp',
		async (req: Request, res: Response, next: NextFunction) => {
			try {
				const { base32, otpauth_url } = totpMfa.generateTOTPSecret();
				const qrCodeUrl = await totpMfa.generateQRCode(otpauth_url);
				return res.json({ secret: base32, qrCodeUrl });
			} catch (err) {
				errorHandler.expressErrorHandler()(
					err as Error,
					req,
					res,
					next
				);
				return res.status(500).json({
					error: 'Unable to generate TOTP secret. Please try again.'
				});
			}
		}
	);

	router.post(
		'/verify-totp',
		async (req: Request, res: Response, next: NextFunction) => {
			const { token, secret } = req.body;

			try {
				const isTOTPTokenValid = totpMfa.verifyTOTPToken(secret, token);
				return res.json({ isTOTPTokenValid });
			} catch (err) {
				errorHandler.expressErrorHandler()(
					err as Error,
					req,
					res,
					next
				);
				return res.status(500).json({
					error: 'Unable to verify TOTP token. Please try again.'
				});
			}
		}
	);

	// sends generated 2FA code to user email
	router.post(
		'/generate-2fa',
		async (req: Request, res: Response, next: NextFunction) => {
			const { email } = req.body;

			const sanitizedEmail = xss(email);

			try {
				const user = await UserRoutes.findOne({
					where: { email: sanitizedEmail }
				});

				if (!user) {
					logger.error('Generate 2FA: User not found');
					return res
						.status(404)
						.json({ error: 'Generate 2FA: User not found' });
				}

				const email2FAUtil = await createEmail2FAUtil({
					bcrypt,
					jwt,
					configService,
					validateDependencies
				});

				const { email2FAToken } =
					await email2FAUtil.generateEmail2FACode();

				user.resetPasswordToken = email2FAToken;
				user.resetPasswordExpires = new Date(Date.now() + 30 * 60000); // 30 minutes
				await user.save();

				const transporter = await mailer.getTransporter();

				await transporter.sendMail({
					to: sanitizedEmail,
					subject: 'Guestbook - Your Login Code',
					text: `Your 2FA code is ${email2FAToken}`
				});

				return res.json({ message: '2FA code sent to email' });
			} catch (err) {
				errorHandler.expressErrorHandler()(
					err as Error,
					req,
					res,
					next
				);
				return res.status(500).json({
					error: 'Generate 2FA: internal server error'
				});
			}
		}
	);

	// route to verify email 2FA code
	router.post(
		'/verify-2fa',
		async (req: Request, res: Response, next: NextFunction) => {
			const { email, email2FACode } = req.body;

			const sanitizedEmail = xss(email);

			try {
				const user = await UserRoutes.findOne({
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
					bcrypt,
					jwt,
					configService,
					validateDependencies
				});

				const isEmail2FACodeValid =
					await email2FAUtil.verifyEmail2FACode(
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
				errorHandler.expressErrorHandler()(
					err as Error,
					req,
					res,
					next
				);
				return res.status(500).json({ error: 'Internal server error' });
			}
		}
	);

	return router;
}
