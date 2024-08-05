// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))


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