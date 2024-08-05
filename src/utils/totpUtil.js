// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const speakeasy = require('speakeasy');
const QRCode = require('qrcode');


function generateTOTPSecret() {
    const secret = speakeasy.generateSecret({ length: 20 });
    return {
        ascii: secret.ascii,
        hex: secret.hex,
        base32: secret.base32,
        otpauth_url: secret.otpauth_url,
    };
};


function generateTOTPToken(secret) {
    const totpToken = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
    });
    return totpToken;
};


function verifyTOTPToken(secret, token) {
    const isTOTPTokenValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1, // gives leeway for clock drift
    });
    return isTOTPTokenValid;
};


function generateQRCode(otpauth_url) {
    return QRCode.toDataURL(otpauth_url);
};


module.exports = {
    generateTOTPSecret,
    generateTOTPToken,
    verifyTOTPToken,
    generateQRCode
};