const { getSecrets } = require("./sops");
const nodemailer = require("nodemailer");


(async () => {
  const secrets = await getSecrets();

  const transporter = nodemailer.createTransport({
    host: secrets.EMAIL_HOST,
    port: secrets.EMAIL_PORT,
    secure: secrets.EMAIL_SECURE,
    auth: {
      user: secrets.EMAIL_USER,
      pass: secrets.SMTP_TOKEN
    } 
  });

  module.exports = { transporter };
})();