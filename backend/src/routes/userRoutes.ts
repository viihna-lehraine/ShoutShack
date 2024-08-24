import express, { Request, Response } from 'express';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { v4 as uuidv4 } from 'uuid';
import xss from 'xss';
import {
	generateConfirmationEmailTemplate,
	generateEmail2FACode,
	generateQRCode,
	generateTOTPSecret,
	getTransporter,
	verifyEmail2FACode,
	verifyTOTPToken
} from '../index.js';
import setupLogger from '../config/logger.js';
import getSecrets from '../config/secrets';
import User from '../models/User';

const router = express.Router();
const logger = await setupLogger();
const secrets = await getSecrets();

// Password strength checker
const checkPasswordStrength = (password: string): boolean => {
	const { score } = zxcvbn(password);
	return score >= 3;
};

// Register
router.post('/register', async (req: Request, res: Response) => {
	const { username, email, password, confirmPassword } = req.body;

	// Sanitize inputs
	const sanitizedUsername = xss(username);
	const sanitizedEmail = xss(email);
	const sanitizedPassword = xss(password);

	if (sanitizedPassword !== confirmPassword) {
		logger.info('Registration failure: passwords do not match');
		return res
			.status(400)
			.json({ password: 'Registration failure: passwords do not match' });
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
		return res
			.status(400)
			.json({ password: 'Registration failure: password is too weak' });
	}

	try {
		const pwnedResponse = await axios.get(
			`https://api.pwnedpasswords.com/range/${sanitizedPassword.substring(0, 5)}`
		);
		const pwnedList = pwnedResponse.data
			.split('\n')
			.map((p: string) => p.split(':')[0]);
		if (pwnedList.includes(sanitizedPassword.substring(5).toUpperCase())) {
			logger.warn(
				'Registration warning: password has been exposed in a data breach'
			);
			return res.status(400).json({
				password:
					'Registration warning: password has been exposed in a data breach'
			});
		}
	} catch (error) {
		logger.error(error);
		logger.error('Registration error: HIBP API check failed');
	}

	try {
		const user = await User.findOne({ where: { email: sanitizedEmail } });
		if (user) {
			logger.info('Registration failure: email already exists');
			return res
				.status(400)
				.json({ email: 'Registration failure: email already exists' });
		} else {
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
			const confirmationUrl = `http://localhost:${process.env.SERVER_PORT}/api/users/confirm/${confirmationToken}`;

			// Send confirmation email
			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: newUser.email,
				subject: 'Guestbook - Account Confirmation',
				html: generateConfirmationEmailTemplate(
					newUser.username,
					confirmationUrl
				)
			};

			await (await getTransporter()).sendMail(mailOptions);

			logger.info('User registration complete');
			res.json({
				message:
					'Registration successful. Please check your email to confirm your account.'
			});
		}
	} catch (err) {
		logger.error('User Registration: server error: ', err);
		res.status(500).json({ error: 'User registration: server error' });
	}

	return;
});

// Login
router.post('/login', async (req: Request, res: Response) => {
	const { email, password } = req.body;

	// sanitize inputs
	const sanitizedEmail = xss(email);
	const sanitizedPassword = xss(password);

	try {
		const user = await User.findOne({ where: { email: sanitizedEmail } });
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
			res.json({ success: true, token: `Bearer ${token}` });
		} else {
			return res.status(400).json({ password: 'Incorrect password' });
		}
	} catch (err) {
		console.error(err);
		logger.error('Login - server error');
		res.status(500).json({ error: 'Login - Server error' });
	}

	return;
});

// Password Recovery (simplified)
router.post('/recover-password', async (req: Request, res: Response) => {
	const { email } = req.body;

	// sanitize inputs
	const sanitizedEmail = xss(email);

	try {
		const user = await User.findOne({ where: { email: sanitizedEmail } });
		if (!user) {
			return res.status(404).json({ email: 'User not found' });
		}
		// Generate a token (customize this later)
		const token = await bcrypt.genSalt(25);
		// let passwordResetUrl = `https://localhost:${process.env.SERVER_PORT}/password-reset${token}`;

		// Store the token in the database (simplified for now)
		user.resetPasswordToken = token;
		user.resetPasswordExpires = new Date(Date.now() + 1800000); // 30 min
		await user.save();

		// Send password reset email
		logger.info('Password reset link sent to user ', user.email);
		res.json({ message: `Password reset link sent to ${user.email}` });
	} catch (err) {
		logger.error('Password Recovery - Server error: ', err);
		res.status(500).json({ error: 'Password Recovery - Server error' });
	}

	return;
});

// Route for TOTP secret generation
router.post('/generate-totp', async (req: Request, res: Response) => {
	// let { username } = req.body; // *DEV-NOTE* does this even need to be here?

	// sanitize username input
	// let sanitizedUsername = xss(username); // *DEV-NOTE* or this?

	// *DEV-NOTE* here, we could store the secret in the session or send it to the client
	// depending on the use case; food for thought

	try {
		const { base32, otpauth_url } = generateTOTPSecret();
		const qrCodeUrl = await generateQRCode(otpauth_url);
		res.json({ secret: base32, qrCodeUrl });
	} catch (err) {
		logger.error('Error generating TOTP secret: ', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Route to verify TOTP tokens
router.post('/verify-totp', async (req: Request, res: Response) => {
	const { token, secret } = req.body;

	try {
		// verify TOTP token using the secret
		const isTOTPTokenValid = verifyTOTPToken(secret, token);
		res.json({ isTOTPTokenValid });
	} catch (err) {
		logger.error('Error verifying TOTP token: ', err);
		res.status(500).json({ error: 'Internal server error' });
	}

	return;
});

// Route to generate and send 2FA codes by email
router.post('/generate-2fa', async (req: Request, res: Response) => {
	const { email } = req.body;

	// sanitize email input
	const sanitizedEmail = xss(email);

	try {
		const user = await User.findOne({ where: { email: sanitizedEmail } });

		if (!user) {
			return res
				.status(404)
				.json({ error: 'Generate 2FA: user not found' });
		}

		const { email2FAToken } = await generateEmail2FACode();

		// save 2FA token and expiration in user's record
		user.resetPasswordToken = email2FAToken;
		user.resetPasswordExpires = new Date(Date.now() + 30 * 60000); // 30 min
		await user.save(); // save user data with the new 2FA token and expiration

		// send the 2FA code to user's email
		await (
			await getTransporter()
		).sendMail({
			to: sanitizedEmail,
			subject: 'Guestbook - Your Login Code',
			text: `Your 2FA code is ${email2FAToken}`
		});

		res.json({ message: '2FA code sent to email' });
	} catch (err) {
		logger.error('Error generating 2FA code: ', err);
		res.status(500).json({ error: 'Generate 2FA: internal server error' });
	}

	return;
});

// Route to verify email 2FA code
router.post('/verify-2fa', async (req: Request, res: Response) => {
	const { email, email2FACode } = req.body;

	// sanitize inputs
	const sanitizedEmail = xss(email);

	try {
		const user = await User.findOne({ where: { email: sanitizedEmail } });
		if (!user) {
			logger.error('Verify 2FA: user not found');
			return res
				.status(404)
				.json({ error: 'Verify 2FA: User not found' });
		}

		const resetPasswordToken = user.resetPasswordToken || '';

		const isEmail2FACodeValid = verifyEmail2FACode(
			resetPasswordToken,
			email2FACode
		);
		if (!isEmail2FACodeValid) {
			logger.error('Invalid or expired 2FA code');
			return res
				.status(400)
				.json({ error: 'Invalid or expired 2FA code' });
		}

		res.json({ message: '2FA code verified successfully' });
	} catch (err) {
		logger.error('Error verifying 2FA code:', err);
		res.status(500).json({ error: 'Internal server error' });
	}

	return;
});

export default router;
