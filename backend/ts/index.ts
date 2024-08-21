import { initializeDatabase } from './config/db';
import featureFlags from './config/featureFlags';
import loadEnv, { __dirname } from './config/loadEnv';
import { setupHttp } from './middleware/http';
import { createTransporter, getTransporter } from './config/mailer';
import multerConfiguredUpload from './config/multer';
import configurePassport from './config/passport';
// import redisClient from './config/redis';
import setupSecurityHeaders from './middleware/securityHeaders';
import slowdownMiddleware from './middleware/slowdown';
import { csrfMiddleware } from './middleware/csrf';
import sops from './config/sops';
import {
	addToBlacklist,
	initializeIpBlacklist,
	ipBlacklistMiddleware,
	loadBlacklist,
	removeFromBlacklist
} from './middleware/ipBlacklist';
import { rateLimitMiddleware } from './middleware/rateLimit';
import {
	registrationValidationRules,
	validateEntry
} from './middleware/validator';
import {
	generateBackupCodes,
	getBackupCodesFromDatabase,
	saveBackupCodesToDatabase,
	verifyBackupCode
} from './utils/auth/backupCodeUtil';
import {
	generateEmail2FACode,
	verifyEmail2FACode
} from './utils/auth/email2FAUtil';
import {
	generateU2fAuthenticationOptions,
	generateU2fRegistrationOptions,
	verifyU2fAuthentication,
	verifyU2fRegistration
} from './utils/auth/fido2Util';
import { verifyJwToken } from './utils/auth/jwtUtil';
import {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration
} from './utils/auth/passkeyUtil';
import {
	generateYubicoOtpOptions,
	validateYubicoOTP
} from './utils/auth/yubicoOtpUtil';
import {
	generateTOTPSecret,
	generateTOTPToken,
	verifyTOTPToken,
	generateQRCode
} from './utils/auth/totpUtil';
import generate2FactorEmailTemplate from './utils/emailTemplates/2FactorEmailTemplate';
import generate2FAEnabledEmailTemplate from './utils/emailTemplates/2FAEnabledEmailTemplate';
import generateAccountDeletedConfirmationEmailTemplate from './utils/emailTemplates/accountDeletedConfirmationEmailTemplate';
import generateAccountDeletionStartedEmailTemplate from './utils/emailTemplates/accountDeletionStartedEmailTemplate';
import generateConfirmationEmailTemplate from './utils/emailTemplates/confirmationEmailTemplate';
import loadTestRoutes from './utils/test/loadTestRoutes';
import { parseBoolean } from './utils/parseBoolean';

export {
	addToBlacklist,
	configurePassport,
	createTransporter,
	csrfMiddleware,
	decryptDataFiles,
	featureFlags,
	generate2FactorEmailTemplate,
	generate2FAEnabledEmailTemplate,
	generateAccountDeletedConfirmationEmailTemplate,
	generateAccountDeletionStartedEmailTemplate,
	generateBackupCodes,
	generateConfirmationEmailTemplate,
	generateEmail2FACode,
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	generateQRCode,
	generateU2fAuthenticationOptions,
	generateU2fRegistrationOptions,
	generateTOTPSecret,
	generateTOTPToken,
	generateYubicoOtpOptions,
	getBackupCodesFromDatabase,
	getSSLKeys,
	getTransporter,
	ipBlacklistMiddleware,
	initializeDatabase,
	initializeIpBlacklist,
	loadBlacklist,
	loadEnv,
	loadTestRoutes,
	multerConfiguredUpload,
	parseBoolean,
	rateLimitMiddleware,
	//	redisClient,
	registrationValidationRules,
	removeFromBlacklist,
	saveBackupCodesToDatabase,
	setupHttp,
	setupSecurityHeaders,
	slowdownMiddleware,
	validateEntry,
	validateYubicoOTP,
	verifyBackupCode,
	verifyEmail2FACode,
	verifyJwToken,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration,
	verifyTOTPToken,
	verifyU2fAuthentication,
	verifyU2fRegistration,
	__dirname
};

let { decryptDataFiles, getSSLKeys } = sops;
