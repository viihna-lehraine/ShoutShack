import initializeDatabase from './config/db.js';
// import featureFlags from './config/featureFlags.js';
import loadEnv, { __dirname, __filename } from './config/loadEnv.js';
import { createTransporter, getTransporter } from './config/mailer.js';
import configurePassport from './config/passport.js';
import setupSecureHeaders from './config/secureHeaders.js';
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
import { parseBoolean } from './utils/parseBoolean.js';

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
	getSSLKeys,
	getTransporter,
	ipBlacklistMiddleware,
	initializeDatabase,
	initializeIPBlacklist,
	loadBlacklist,
	loadEnv,
	loadTestRoutes,
	limiter,
	parseBoolean,
	registrationValidationRules,
	removeFromBlacklist,
	setupSecureHeaders,
	validateEntry,
	verifyEmail2FACode,
	verifyTOTPToken,
	__dirname,
	__filename,
};
