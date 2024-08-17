import initializeDatabase from './config/db.js';
import featureFlags from './config/featureFlags.js';
import loadEnv, {
	__dirname,
	 __filename
} from './config/loadEnv.js';
import startServer from './middleware/http.js';
import {
	createTransporter,
	getTransporter } from './config/mailer.js';
import multerConfiguredUpload from '../ts/config/multer.js';
import configurePassport from './config/passport.js';
import redisClient from './config/redis.js';
import setupSecurityHeaders from './middleware/securityHeaders.js';
import slowdownMiddleware from './middleware/slowdown.js';
import sops from './config/sops.js';
import {
	addToBlacklist,
	initializeIpBlacklist,
	ipBlacklistMiddleware,
	loadBlacklist,
	removeFromBlacklist,
} from './middleware/ipBlacklist.js';
import { rateLimitMiddleware} from './middleware/rateLimit.js';
import {
	registrationValidationRules,
	validateEntry,
} from './middleware/validator.js';
import {
	generateBackupCodes,
	getBackupCodesFromDatabase,
	saveBackupCodesToDatabase,
	verifyBackupCode,
} from './utils/auth/backupCodeUtil.js';
import {
	generateEmail2FACode,
	verifyEmail2FACode,
} from './utils/auth/email2FAUtil.js';
import { verifyJwToken } from './utils/auth/jwtUtil.js';
import {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration,
} from './utils/auth/passkeyUtil.js';
import {
	generateYubicoOtpOptions,
	validateYubicoOTP,
} from './utils/auth/yubicoOtpUtil.js';
import {
	generateTOTPSecret,
	generateTOTPToken,
	verifyTOTPToken,
	generateQRCode,
} from './utils/auth/totpUtil.js';
import generate2FactorEmailTemplate from './utils/emailTemplates/2FactorEmailTemplate.js';
import generate2FAEnabledEmailTemplate from './utils/emailTemplates/2FAEnabledEmailTemplate.js';
import generateAccountDeletedConfirmationEmailTemplate from './utils/emailTemplates/accountDeletedConfirmationEmailTemplate.js';
import generateAccountDeletionStartedEmailTemplate from './utils/emailTemplates/accountDeletionStartedEmailTemplate.js';
import generateConfirmationEmailTemplate from './utils/emailTemplates/confirmationEmailTemplate.js';
import loadTestRoutes from './utils/test/loadTestRoutes.js';
import { parseBoolean } from '../ts/utils/parseBoolean.js';

export {
	addToBlacklist,
	configurePassport,
	createTransporter,
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
	generateJWToken,
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
	redisClient,
	registrationValidationRules,
	removeFromBlacklist,
	saveBackupCodesToDatabase,
	setupSecurityHeaders,
	slowdownMiddleware,
	startServer,
	validateEntry,
	validateYubicoOTP,
	verifyBackupCode,
	verifyEmail2FACode,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration,
	verifyTOTPToken,
	verifyJwToken,
	__dirname,
	__filename,
};


export async function loadU2fUtils() {
	const {
		generateU2fAuthenticationOptions,
		generateU2fRegistrationOptions,
		verifyU2fAuthentication,
		verifyU2fRegistration,
	} = await import('./utils/auth/fido2Util.js');

	return {
		generateU2fAuthenticationOptions,
		generateU2fRegistrationOptions,
		verifyU2fAuthentication,
		verifyU2fRegistration,
	};
}

const { decryptDataFiles, getSSLKeys } = sops;
