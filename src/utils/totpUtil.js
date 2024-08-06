// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const speakeasy = require('speakeasy');
const QRCode = require('qrcode');


function generateTOTPSecret() {
    const totpSecret = speakeasy.generateSecret({ length: 20 });
    return {
        ascii: totpSecret.ascii,
        hex: totpSecret.hex,
        base32: totpSecret.base32,
        otpauth_url: totpSecret.otpauth_url,
    };
};


function generateTOTPToken(totpSecret) {
    const totpToken = speakeasy.totp({
        totpSecret: totpSecret,
        encoding: 'base32',
    });
    return totpToken;
};


function verifyTOTPToken(totpSecret, totpToken) {
    const isTOTPTokenValid = speakeasy.totp.verify({
        totpSecret: totpSecret,
        encoding: 'base32',
        totpToken: totpToken,
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