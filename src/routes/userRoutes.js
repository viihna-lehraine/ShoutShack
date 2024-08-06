// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const zxcvbn = require('zxcvbn');
const crypto = require('crypto');
const User = require('../models/User');
const transporter = require('../config/mailer');
const confirmationEmailTemplate = require('../utils/emailTemplates/confirmationEmailTemplate');
const email2FAUtil = require('../utils/email2FAUtil');
const totpUtil = require('../utils/totpUtil');
const getSecrets = require('../config/sops');

const secrets = await getSecrets();

const router = express.Router();


// Password strength checker
const checkPasswordStrength = (password) => {
    const { score } = zxcvbn(password);
    return score >= 3;
};


// Register
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ password: 'Passwords do not match' });
    }

    if (!User.validatePassword(password)) {
        return res.status(400).json({ password: 'Password does not meet complexity requirements' });
    }

    if (!checkPasswordStrength(password)) {
        return res.status(400).json({ password: 'Password is too weak' });
    }

    let hibpCheckFailed = false;

    try {
        const pwnedResponse = await axios.get(`https://api.pwnedpasswords.com/range/${password.substring(0, 5)}`);
        const pwnedList = pwnedResponse.data.split('n').map(p => p.split(':')[0]);
        if (pwnedList.includes(password.substring(5).toUppercase())) {
            return res.status(400).json({ password: 'Password has been exposed in a data breach' });
        }
    } catch (error) {
        console.error('Registration - HIBP API check failed');
        hibpCheckFailed = true;
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ email: 'Email already exists' });
        } else {
            const salt = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await argon2.hash(password + secrets.PEPPER, { type: argon2.argon2id, salt });
            const newUser = await User.create({ username, email, password: hashedPassword, hibpCheckFailed });
            // if (hibpCheckFailed) {
                // *DEV-NOTE* send user an email advising to reset password in the future
            // }
            
            // Generate a confirmation token
            const confirmationToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const confirmationUrl = `http://localhost:${secrets.PORT}/api/users/confirm/${confirmationToken}`;

            // Send confirmation email
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: newUser.email,
                subject: 'Guestbook - Account Confirmation',
                html: confirmationEmailTemplate(newUser.username, confirmationUrl)
            };

            await transporter.sendMail(mailOptions);

            res.json({ message: 'Registration successful. Please check your email to confirm your account.' });
        }
    } catch (err) {
        console.error('Registration - Server error: ', err);
        res.status(500).json({ error: 'Registration - Server error' });
    }
});


// Email confirmaton route
router.get('/confirm/:token', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(400).json({ error: 'Invalid token' });
        }
        user.isAccountVerified = true;
        await user.save();
        res.json({ message: 'Email confirmed successfully!' });
    } catch (err) {
        console.error('Email Confirmation > Server Error ', err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email }});
        if (!user) {
            console.log('400 - User not found');
            return res.status(400).json({ email: 'User not found' });
        }
        const isMatch = await argon2.verify(user.password, password + secrets.PEPPER);
        if (isMatch) {
            const payload = { id: user.id, username: user.username };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token: 'Bearer ', token });
        } else {
            return res.status(400).json({ password: 'Incorrect password' });
        }
    } catch (err) {
        console.error('Login - Server error');
        res.status(500).json({ error: ' Login - Server error' });
    }
});


// Password Recovery (simplified)
router.post('/recover-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email }});
        if (!user) {
            return res.status(404).json({ email: 'User not found' });
        }
        // Generate a token (customize this later)
        const token = crypto.randomBytes(20).toString('hex');
        const passwordResetUrl = `https://localhost:${secrets.PORT}/password-reset${token}`;

        // Store the token in the database (simplified for now)
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1800000; // 30 minutes
        await user.save();

        // Send password reset email
        res.json({ message: `Pasword reset link sent to ${user.email}` });
    } catch (err) {
        console.error('Password Recovery - Server error: ', err);
        res.status(500).json({ error: 'Password Recovery - Server error' });
    }
});


// Route for TOTP secret generation
router.post('/generate-totp', async (req, res) => {
    const { username } = req.body;
    try {
        const { secret, otpauth_url } = totpUtil.generateTOTPSecret(username);
        const qrCodeUrl = await totpUtil.generateQRCode(otpauth_url);

        res.json({ secret, qrCodeUrl });
    } catch (err) {
        console.error('Error generating TOTP secret: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route to verify TOTP tokens
router.post('/verify-totp', async (req, res) => {    
    const { username, token } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isTOTPTokenValid = totpUtil.verifyTOTPToken(user.totpSecret, token);
        res.json({ isTOTPTokenValid });
    } catch (err) {
        console.error('Error verifying TOTP token: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route to generate and send 2FA codes by email
router.post('/generate-2fa', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { code, token } = email2FAUtil.generateEmail2FACode();

        // *DEV-NOTE* PLEASE MAKE SURE THESE ARE THE CORRECT VARIABLES
        user.resetPasswordToken = token;
        user,resetPasswodExpires = new Date(Date.now() + 30 * 60000); // 30 min
        await user.save();

        await mailer.sendMail({ // send the 2FA code to user's email
            to: email,
            subject: 'Guestbook - Your Login Code',
            text: `Your 2FA code is ${email2FACode}`,
        });

        res.json({ message: '2FA code sent to email'  });
    } catch (err) {
        console.error('Error generating 2FA code: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route to verify email 2FA code
router.post('/verify-2fa', async (req, res) => {
    const { email, email2FACode } = req.body;
    try {
        const user = await User.findOne({ where: { email} });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isEmail2FACodeValid = email2FAUtil.verifyEmail2FACode(user.resetPasswordToken, email2FACode);
        if (!isEmail2FACodeValid) {
            return res.status(400).json({ errpr: 'Invalid or expired 2FA code' });
        }

        res.json({  message: '2FA code verified sucessfully' });
    } catch (err) {
        console.error('Error verifying 2FA code:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;