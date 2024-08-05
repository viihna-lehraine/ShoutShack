// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const express = require('express');
const path = require('path');
const logger = require('../config/logger');

const router = express.Router();


// Home / Login page route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
    logger.info('index.html was accessed');
});


// About page route
router.get('/about', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/about.html'));
    logger.info('about.html was accessed');
});


// Confirm page route
router.get('/confirm', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/confirm.html'));
    logger.info('confirm.html was accessed');
});


// Dashboard page route
router.get('/dashboard', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
    logger.info('dashboard.html was accessed');
});


// FAQ page route
router.get('/faq', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
    logger.info('faq.html was accessed');
});


// Password-Reset page route
router.get('/password-reset', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/password-reset.html'));
    logger.info('password-reset.html was accessed');
});


// Register page route
router.get('/register', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/register.html'));
    logger.info('register.html was accessed');
});


// Resources page route
router.get('/resources', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/resources.html'));
    logger.info('resources.html was accessed');
});


// TOS page route
router.get('/tos', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/tos.html'));
    logger.info('tos.html was accessed');
});


module.exports = router;