// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const getSecrets = require('../config/sops');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


(async () => {
    const secrets = await getSecrets();

    function generateEmail2FACode() {
        const email2FACode = crypto.randomBytes(3).toString('hex'); // generates a 6-character hex code
        const email2FAToken = jwt.sign({ email2FACode }, secrets.EMAIL_2FA_KEY, { expiresIn: '30m' });
        return { email2FACode, email2FAToken };
    }

    function verifyEmail2FACode() {
        try {
            const decodedEmail2FACode = jwt.verify(email2FAToken, secrets.EMAIL_2FA_KEY);
            return decodedEmail2FACode.code === email2FACode;
        } catch (err) {
            return false;
        }
    }

    module.exports = {
        generateEmail2FACode,
        verifyEmail2FACode
    };
})();