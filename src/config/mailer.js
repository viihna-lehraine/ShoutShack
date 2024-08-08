import { getSecrets } from './sops';
import nodemailer from 'nodemailer';

async function createTransporter() {
  const secrets = await getSecrets();

  const transporter = nodemailer.createTransport({
    host: secrets.EMAIL_HOST,
    port: secrets.EMAIL_PORT,
    secure: secrets.EMAIL_SECURE,
    auth: {
      user: secrets.EMAIL_USER,
      pass: secrets.SMTP_TOKEN,
    },
  });

  return transporter;
}

const transporter = await createTransporter();

export default transporter;