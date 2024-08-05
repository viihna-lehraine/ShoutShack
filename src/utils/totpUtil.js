const speakeasy = require('speakeasy');
const QRCode = require('qrcode');


module.exports = {
    generateTOTPSecret: () => {
        const secret = speakeasy.generateSecret({ length: 20 });
        return {
            ascii: secret.ascii,
            hex: secret.hex,
            base32: secret.base32,
            otpauth_url: secret.otpauth_url,
        };
    },


    generateTOTPToken: (secret) => {
        const token = speakeasy.totp({
            secret: secret,
            encoding: 'base32',
        });
        return token;
    },

    verifyTOTPToken: (secret, token) => {
        const isTOTPTokenValid = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1, // gives leeway for clock drift
        });
        return isTOTPTokenValid;
    },
};


function generateQRCode(otpauth_url) {
    return QRCode.toDataURL(otpauth_url);
};


module.exports = {
    generateTOTPSecret,
    verifyTOTPToken,
    generateQRCode
};