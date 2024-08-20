import express from 'express';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
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
import getSecrets from '../config/secrets.js';
import UserModelPromise from '../../ts/models/User.js';

const router = express.Router();

// Password strength checker
const checkPasswordStrength = (password) => {
	const { score } = zxcvbn(password);
	return score >= 3;
};

// Register
router.post('/register', async (req, res) => {
	const { username, email, password, confirmPassword } = req.body;
	const secrets = await getSecrets();
	const logger = await setupLogger();

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

	const User = await UserModelPromise;
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

	let hibpCheckFailed = false;

	try {
		const pwnedResponse = await axios.get(
			`https://api.pwnedpasswords.com/range/${sanitizedPassword.substring(0, 5)}`
		);
		const pwnedList = pwnedResponse.data
			.split('\n')
			.map((p) => p.split(':')[0]);
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
		logger.error('Registration error: HIBP API check failed');
		hibpCheckFailed = true;
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
				username: sanitizedUsername,
				email: sanitizedEmail,
				password: hashedPassword,
				hibpCheckFailed
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
});

// Login
router.post('/login', async (req, res) => {
	const secrets = await getSecrets();
	const logger = await setupLogger();
	const { email, password } = req.body;

	// sanitize inputs
	const sanitizedEmail = xss(email);
	const sanitizedPassword = xss(password);

	try {
		const User = await UserModelPromise;
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
			const payload = { id: user.id, username: user.username };
			const token = jwt.sign(payload, secrets.JWT_SECRET, {
				expiresIn: '1h'
			});
			res.json({ success: true, token: `Bearer ${token}` });
		} else {
			return res.status(400).json({ password: 'Incorrect password' });
		}
	} catch (err) {
		logger.error('Login - server error');
		res.status(500).json({ error: 'Login - Server error' });
	}
});

// Password Recovery (simplified)
router.post('/recover-password', async (req, res) => {
	const logger = await setupLogger();
	const { email } = req.body;

	// sanitize inputs
	const sanitizedEmail = xss(email);

	try {
		const User = await UserModelPromise;
		const user = await User.findOne({ where: { email: sanitizedEmail } });
		if (!user) {
			return res.status(404).json({ email: 'User not found' });
		}
		// Generate a token (customize this later)
		const token = await bcrypt.genSalt(25);
		const passwordResetUrl = `https://localhost:${process.env.SERVER_PORT}/password-reset${token}`;

		// Store the token in the database (simplified for now)
		user.resetPasswordToken = token;
		user.resetPasswordExpires = Date.now() + 1800000; // 30 minutes
		await user.save();

		// Send password reset email
		logger.info('Password reset link sent to user ', user.email);
		res.json({ message: `Password reset link sent to ${user.email}` });
	} catch (err) {
		logger.error('Password Recovery - Server error: ', err);
		res.status(500).json({ error: 'Password Recovery - Server error' });
	}
});

// Route for TOTP secret generation
router.post('/generate-totp', async (req, res) => {
	const logger = await setupLogger();
	const { username } = req.body;

	// sanitize username input
	const sanitizedUsername = xss(username);

	try {
		const { secret, otpauth_url } = generateTOTPSecret(sanitizedUsername);
		const qrCodeUrl = await generateQRCode(otpauth_url);
		res.json({ secret, qrCodeUrl });
	} catch (err) {
		logger.error('Error generating TOTP secret: ', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Route to verify TOTP tokens
router.post('/verify-totp', async (req, res) => {
	const logger = await setupLogger();
	const { username, token } = req.body;

	// sanitize username input
	const sanitizedUsername = xss(username);

	try {
		const User = await UserModelPromise;
		const user = await User.findOne({
			where: { username: sanitizedUsername }
		});
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		const isTOTPTokenValid = verifyTOTPToken(user.totpSecret, token);
		res.json({ isTOTPTokenValid });
	} catch (err) {
		logger.error('Error verifying TOTP token: ', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Route to generate and send 2FA codes by email
router.post('/generate-2fa', async (req, res) => {
	const logger = await setupLogger();
	const { email } = req.body;

	// sanitize email input
	const sanitizedEmail = xss(email);

	try {
		const User = await UserModelPromise;
		const user = await User.findOne({ where: { email: sanitizedEmail } });
		if (!user) {
			return res
				.status(404)
				.json({ error: 'Generate 2FA: user not found' });
		}

		const { token } = generateEmail2FACode();

		user.resetPasswordToken = token;
		user.resetPasswordExpires = new Date(Date.now() + 30 * 60000); // 30 min
		await user.save();

		await (
			await getTransporter()
		).sendMail({
			// send the 2FA code to user's email
			to: sanitizedEmail,
			subject: 'Guestbook - Your Login Code',
			text: `Your 2FA code is ${token}`
		});

		res.json({ message: '2FA code sent to email' });
	} catch (err) {
		logger.error('Error generating 2FA code: ', err);
		res.status(500).json({ error: 'Generate 2FA: internal server error' });
	}
});

// Route to verify email 2FA code
router.post('/verify-2fa', async (req, res) => {
	const logger = await setupLogger();
	const { email, email2FACode } = req.body;

	// sanitize inputs
	const sanitizedEmail = xss(email);

	try {
		const User = await UserModelPromise;
		const user = await User.findOne({ where: { email: sanitizedEmail } });
		if (!user) {
			logger.error('Verify 2FA: user not found');
			return res
				.status(404)
				.json({ error: 'Verify 2FA: User not found' });
		}

		const isEmail2FACodeValid = verifyEmail2FACode(
			user.resetPasswordToken,
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
});

export default router;
