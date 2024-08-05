const express = require('express');
const path = require('path');

const router = express.Router();


// Home / Login page route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});


// About page route
router.get('/about', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/about.html'));
});


// Confirm page route
router.get('/confirm', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/confirm.html'));
});


// Dashboard page route
router.get('/dashboard', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});


// FAQ page route
router.get('/dashboard', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});


// Password-Reset page route
router.get('/password-reset', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/password-reset.html'));
});


// Register page route
router.get('/register', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/register.html'));
});


// Resources page route
router.get('/resources', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/resources.html'));
});


// TOS page route
router.get('/tos', (reg, res) => {
    res.sendFile(path.join(__dirname, '../../public/tos.html'));
});


module.exports = router;