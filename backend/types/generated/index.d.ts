import { getSequelizeInstance, initializeDatabase } from './config/database';
import { getFeatureFlags, parseBoolean } from './utils/featureFlags';
import loadEnv from './utils/loadEnv';
import { setupHttp } from './http';
import { createTransporter, getTransporter } from './services/mailer';
import multerConfiguredUpload from './config/multer';
import configurePassport from './auth/passport';
import { getRedisClient } from './services/redis';
import errorHandler from './middleware/expressErrorHandler';
import setupSecurityHeaders from './middleware/securityHeaders';
import slowdownMiddleware from './middleware/slowdown';
import { csrfMiddleware } from './middleware/csrf';
import { addToBlacklist, initializeIpBlacklist, ipBlacklistMiddleware, loadBlacklist, removeFromBlacklist } from './middleware/blacklist';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { registrationValidationRules, validateEntry } from './middleware/validator';
import { generateBackupCodes, getBackupCodesFromDatabase, saveBackupCodesToDatabase, verifyBackupCode } from './auth/backupCode';
import { generateEmail2FACode, verifyEmail2FACode } from './auth/emailMultiFactorAuth';
import { verifyJwToken } from './auth/jwtAuth';
import { generateYubicoOtpOptions, validateYubicoOTP } from './auth/yubicoOtpMfa';
import { generateTOTPSecret, generateTOTPToken, verifyTOTPToken, generateQRCode } from './auth/totpMFA';
import generate2FactorEmailTemplate from './utils/emailTemplates/2FactorEmailTemplate';
import generate2FAEnabledEmailTemplate from './utils/emailTemplates/2FAEnabledEmailTemplate';
import generateAccountDeletedConfirmationEmailTemplate from './utils/emailTemplates/accountDeletedConfirmationEmailTemplate';
import generateAccountDeletionStartedEmailTemplate from './utils/emailTemplates/accountDeletionStartedEmailTemplate';
import generateConfirmationEmailTemplate from './utils/emailTemplates/confirmationEmailTemplate';
import loadTestRoutes from './utils/test/loadTestRoutes';
import { startMemoryMonitor } from './utils/memoryMonitor';
export { addToBlacklist, configurePassport, createTransporter, csrfMiddleware, decryptDataFiles, errorHandler, generate2FactorEmailTemplate, generate2FAEnabledEmailTemplate, generateAccountDeletedConfirmationEmailTemplate, generateAccountDeletionStartedEmailTemplate, generateBackupCodes, generateConfirmationEmailTemplate, generateEmail2FACode, generateQRCode, getRedisClient, generateTOTPSecret, generateTOTPToken, generateYubicoOtpOptions, getBackupCodesFromDatabase, getFeatureFlags, getSequelizeInstance, getSSLKeys, getTransporter, ipBlacklistMiddleware, initializeDatabase, initializeIpBlacklist, loadBlacklist, loadEnv, loadTestRoutes, multerConfiguredUpload, parseBoolean, rateLimitMiddleware, registrationValidationRules, removeFromBlacklist, saveBackupCodesToDatabase, setupHttp, setupSecurityHeaders, slowdownMiddleware, startMemoryMonitor, validateEntry, validateYubicoOTP, verifyBackupCode, verifyEmail2FACode, verifyJwToken, verifyTOTPToken };
declare const decryptDataFiles: () => Promise<{
    [key: string]: string;
}>, getSSLKeys: () => Promise<{
    key: string;
    cert: string;
}>;
//# sourceMappingURL=index.d.ts.map
