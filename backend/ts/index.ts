import initializeDatabase from './config/db';
import featureFlags from './config/featureFlags';
import loadEnv, {
	__dirname,
	 __filename
} from './config/loadEnv.ts';
import startServer from './middleware/http';
import {
	createTransporter,
	getTransporter } from './config/mailer';
import multerConfiguredUpload from './config/multer';
import configurePassport from './config/passport';
import redisClient from './config/redis';
import setupSecurityHeaders from './middleware/securityHeaders';
import slowdownMiddleware from './middleware/slowdown';
import sops from './config/sops';
import {
	addToBlacklist,
	initializeIpBlacklist,
	ipBlacklistMiddleware,
	loadBlacklist,
	removeFromBlacklist,
} from './middleware/ipBlacklist';
import { rateLimitMiddleware} from './middleware/rateLimit';
import {
	registrationValidationRules,
	validateEntry,
} from './middleware/validator';
import {
	generateBackupCodes,
	getBackupCodesFromDatabase,
	saveBackupCodesToDatabase,
	verifyBackupCode,
} from './utils/auth/backupCodeUtil';
import {
	generateEmail2FACode,
	verifyEmail2FACode,
} from './utils/auth/email2FAUtil';
import { verifyJwToken } from './utils/auth/jwtUtil';
import {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration,
} from './utils/auth/passkeyUtil';
import {
	generateYubicoOtpOptions,
	validateYubicoOTP,
} from './utils/auth/yubicoOtpUtil';
import {
	generateTOTPSecret,
	generateTOTPToken,
	verifyTOTPToken,
	generateQRCode,
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
	} = await import('./utils/auth/fido2Util');

	return {
		generateU2fAuthenticationOptions,
		generateU2fRegistrationOptions,
		verifyU2fAuthentication,
		verifyU2fRegistration,
	};
}

const { decryptDataFiles, getSSLKeys } = sops;
