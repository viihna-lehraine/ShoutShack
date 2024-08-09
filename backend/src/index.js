import initializeDatabase from './config/db.js';
import loadEnv, { __dirname, __filename } from './config/loadEnv.js';
import setupLogger from './config/logger.js';
import { createTransporter, getTransporter } from './config/mailer.js';
import configurePassport from './config/passport.js';
import getSecrets from './config/secrets.js';
import getSSLKeys from './config/sops.js';
import { registrationValidationRules, validateEntry } from './middleware/validate.js';
import {
  generateEmail2FACode,
  verifyEmail2FACode,
} from './utils/email2FAUtil.js';
import {
  generateTOTPSecret,
  generateTOTPToken,
  verifyTOTPToken,
  generateQRCode,
} from './utils/auth/totpUtil.js';

import emailTemplates from './utils/emailTemplates/indexEmailTemplates.js';

loadEnv();

export {
  configurePassport,
  createTransporter,
  emailTemplates,
  generateEmail2FACode,
  generateQRCode,
  generateTOTPSecret,
  generateTOTPToken,
  getSecrets,
  getSSLKeys,
  getTransporter,
  initializeDatabase,
  registrationValidationRules,
  setupLogger,
  validateEntry,
  verifyEmail2FACode,
  verifyTOTPToken,
  __dirname,
  __filename,
};
