import { getSequelizeInstance, initializeDatabase } from './config/db';
import { getFeatureFlags, parseBoolean } from './config/featureFlags';
import { loadEnv } from './config/loadEnv';
import { setupHttp } from './config/http';
import { getTransporter } from './config/mailer';
import multerConfiguredUpload from './config/multer';
import configurePassport from './config/passport';
import { getRedisClient } from './config/redis';
import errorHandler from './middleware/errorHandler';
import { setupSecurityHeaders } from './middleware/securityHeaders';
import slowdownMiddleware from './middleware/slowdown';
import { createCsrfMiddleware } from './middleware/csrf';
import sops from './config/sops';
import { createIpBlacklist } from './middleware/ipBlacklist';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { createValidatorMiddleware } from './middleware/validator';
import createBackupCodeService from './utils/auth/backupCodeUtil';
import createEmail2FAUtil from './utils/auth/email2FAUtil';
//import {
//	generateU2fAuthenticationOptions,
//	generateU2fRegistrationOptions,
//	verifyU2fAuthentication,
//	verifyU2fRegistration
// } from './utils/auth/fido2Util';
import createJwtUtil from './utils/auth/jwtUtil';
// import {
// 	generatePasskeyAuthenticationOptions,
// 	generatePasskeyRegistrationOptions,
// 	verifyPasskeyAuthentication,
// 	verifyPasskeyRegistration
// } from './utils/auth/passkeyUtil';
import createYubicoOtpUtil from './utils/auth/yubicoOtpUtil';
import createTOTPUtil from './utils/auth/totpUtil';
import generate2FactorEmailTemplate from './utils/emailTemplates/2FactorEmailTemplate';
import generate2FAEnabledEmailTemplate from './utils/emailTemplates/2FAEnabledEmailTemplate';
import generateAccountDeletedConfirmationEmailTemplate from './utils/emailTemplates/accountDeletedConfirmationEmailTemplate';
import generateAccountDeletionStartedEmailTemplate from './utils/emailTemplates/accountDeletionStartedEmailTemplate';
import generateConfirmationEmailTemplate from './utils/emailTemplates/confirmationEmailTemplate';
import loadTestRoutes from './utils/test/loadTestRoutes';
import { createMemoryMonitor } from './utils/memoryMonitor';

export {
	configurePassport,
	createBackupCodeService,
	createCsrfMiddleware,
	createEmail2FAUtil,
	createIpBlacklist,
	createJwtUtil,
	createMemoryMonitor,
	createTOTPUtil,
	createValidatorMiddleware,
	createYubicoOtpUtil,
	errorHandler,
	generate2FactorEmailTemplate,
	generate2FAEnabledEmailTemplate,
	generateAccountDeletedConfirmationEmailTemplate,
	generateAccountDeletionStartedEmailTemplate,
	generateConfirmationEmailTemplate,
	// generatePasskeyAuthenticationOptions,
	// generatePasskeyRegistrationOptions,
	getRedisClient,
	// generateU2fAuthenticationOptions,
	// generateU2fRegistrationOptions,
	getFeatureFlags,
	getSequelizeInstance,
	getTransporter,
	initializeDatabase,
	loadEnv,
	loadTestRoutes,
	multerConfiguredUpload,
	parseBoolean,
	rateLimitMiddleware,
	setupHttp,
	setupSecurityHeaders,
	slowdownMiddleware,
	sops
	// verifyPasskeyAuthentication,
	// verifyPasskeyRegistration,
	// verifyU2fAuthentication,
	// verifyU2fRegistration
};
