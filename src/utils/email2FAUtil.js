const { getSecrets } = require('../config/sops');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

(async () => {
  const secrets = await getSecrets();

  function generateEmail2FACode() {
    const email2FACode = bcrypt.genSalt(6); // generates a 6-character hex code
    const email2FAToken = jwt.sign({ email2FACode }, secrets.EMAIL_2FA_KEY, {
      expiresIn: '30m',
    });
    return {
      email2FACode,
      email2FAToken,
    };
  }

  function verifyEmail2FACode() {
    try {
      const decodedEmail2FACode = jwt.verify(
        email2FAToken,
        secrets.EMAIL_2FA_KEY,
      );
      return decodedEmail2FACode.code === email2FACode;
    } catch (err) {
      return false;
    }
  }

  module.exports = {
    generateEmail2FACode,
    verifyEmail2FACode,
  };
})();
