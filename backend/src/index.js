import initializeDatabase from './config/db.js';
import loadEnv, { __dirname, __filename } from './config/loadEnv.js';
import setupLogger from './config/logger.js';
import { createTransporter, getTransporter } from './config/mailer.js';
import configurePassport from './config/passport.js';
import getSecrets from './config/secrets.js';
import setupSecurityHeaders from './config/securityHeaders.js';
import getSSLKeys from './config/sops.js';
import {
	addToBlacklist,
	initializeIPBlacklist,
	ipBlacklistMiddleware,
	loadBlacklist,
	removeFromBlacklist,
} from './middleware/ipBlacklist.js';
import limiter from './middleware/rateLimit.js';
import {
	registrationValidationRules,
	validateEntry,
} from './middleware/validate.js';
import { loadTestRoutes } from './utils/helpers.js';
import {
	generateEmail2FACode,
	verifyEmail2FACode,
} from './utils/auth/email2FAUtil.js';
import {
	generateTOTPSecret,
	generateTOTPToken,
	verifyTOTPToken,
	generateQRCode,
} from './utils/auth/totpUtil.js';
import generate2FactorEmailTemplate from './utils/templates/email/2FactorEmailTemplate.js';
import generate2FAEnabledEmailTemplate from './utils/templates/email/2FAEnabledEmailTemplate.js';
import generateAccountDeletedConfirmationEmailTemplate from './utils/templates/email/accountDeletedConfirmationEmailTemplate.js';
import generateAccountDeletionStartedEmailTemplate from './utils/templates/email/accountDeletionStartedEmailTemplate.js';
import generateConfirmationEmailTemplate from './utils/templates/email/confirmationEmailTemplate.js';

loadEnv();

export {
	addToBlacklist,
	configurePassport,
	createTransporter,
	generate2FactorEmailTemplate,
	generate2FAEnabledEmailTemplate,
	generateAccountDeletedConfirmationEmailTemplate,
	generateAccountDeletionStartedEmailTemplate,
	generateConfirmationEmailTemplate,
	generateEmail2FACode,
	generateQRCode,
	generateTOTPSecret,
	generateTOTPToken,
	getSecrets,
	getSSLKeys,
	getTransporter,
	ipBlacklistMiddleware,
	initializeDatabase,
	initializeIPBlacklist,
	loadBlacklist,
	loadTestRoutes,
	limiter,
	registrationValidationRules,
	removeFromBlacklist,
	setupLogger,
	setupSecurityHeaders,
	validateEntry,
	verifyEmail2FACode,
	verifyTOTPToken,
	__dirname,
	__filename,
};
