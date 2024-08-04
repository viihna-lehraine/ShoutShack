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

const router = express.Router();

const PEPPER = process.env.PEPPER || 'PEPPER';


// Password strength checker
const checkPasswordStrength = (password) => {
    const { score } = zxcvbn(password);
    return score >= 3;
};


// Register
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ password: 'Passwords do not match'});
    }

    if (!User.validatePassword(password)) {
        return res.status(400).json({ password: 'Password must be between 8 and 128 characters'});
    }

    if (!checkPasswordStrength(password)) {
        return res.status(400).json({ password: 'Password is too weak' });
    }

    try {
        const pwnedResponse = await axios.get(`https://api.pwnedpasswords.com/range/${password.substring(0, 5)}`);
        const pwnedList = pwnedResponse.data.split('n').map(p => p.split(':')[0]);
        if (pwnedList.includes(password.substring(5).toUppercase())) {
            return res.status(400).json({ passwod: 'Password has been exposed in a data breach' });
        }
    } catch (error) {
        console.error('Registration - Error checking password against Have I Been Pwned');
        return res.status(500).json({ error: 'Error checking password against Have I Been Pwned' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ email: 'Email already exists' });
        } else {
            const salt = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await argon2.hash(password + PEPPER, { type: argon2.argon2id, salt });
            const newUser = await User.create({ username, email, password: hashedPassword });
            res.json(newUser);
        }
    } catch (err) {
        console.error('Registration - Server error: ', err);
        res.status(500).json({ error: 'Registration - Server error' });
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
            res.json({ success: true, token: 'Bearer ' + token });
        } else {
            return res.status(400).json({ password: 'Incorrect password' });
        }
    } catch (err) {
        console.error('Login - Server error');
        res.status(500).json({ error: ' Login - Server error' });
    }
})