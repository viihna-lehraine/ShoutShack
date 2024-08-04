const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const axios = require('axios');
const zxcvbn = require('zxcvbn');
const crypto = require('crypto');
const transporter = require('../config/mailer');
const confirmationEmailTemplate = require('../utils/confirmationEmailTemplate');

const router = express.Router();

const PORT = process.env.SERVER_PORT || 3000;
const PEPPER = process.env.PEPPER;


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
            const hashedPassword = await argon2.hash(password + PEPPER, { type: argon2.argon2id, salt });
            const newUser = await User.create({ username, email, password: hashedPassword, hibpCheckFailed });
            // if (hibpCheckFailed) {
                // *DEV-NOTE* send user an email advising to reset password in the future
            // }
            
            // Generate a confirmation token
            const confirmationToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
            const confirmationUrl = `http://localhost:${process.env.SERVER_PORT}/api/users/confirm/${confirmationToken}`;

            // Send confirmation email
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: newUser.email,
                subject: 'Please confirm your email',
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
        user.isVerified = true;
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
        const isMatch = await argon2.verify(user.password, password + PEPPER);
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
        const passwordResetUrl = `https://localhost:${SERVER_PORT}/password-reset${token}`;

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


module.exports = router;