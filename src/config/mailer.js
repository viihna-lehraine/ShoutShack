const getSecrets = require('./sops');

const secrets = getSecrets();

const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: secrets.EMAIL_HOST,
    port: secrets.EMAIL_PORT,
    secure: secrets.EMAIL_SECURE,
    auth: {
        user: secrets.EMAIL_USER,
        pass: secrets.SMTP_TOKEN
    } 
});


module.exports = transporter;