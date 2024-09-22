import '../../types/custom/yub.js';

export type FidoFactor = 'first' | 'second' | 'either';

export interface BackupCode {
	code: string;
	used: boolean;
}

export interface BackupCodeService {
	UserMfa: typeof import('../models/UserMfaModelFile').UserMfa;
	crypto: typeof import('crypto');
	bcrypt: typeof import('bcrypt');
	configService: typeof import('../services/configService.js').configService;
	appLogger: import('../services/appLogger.js').AppLogger;
}

export interface CreateJwt {
	configService: typeof import('../services/configService.js').configService;
	appLogger: import('../services/appLogger.js').AppLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorLogger: typeof import('../services/errorLogger.js').ErrorLogger;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: typeof import('../utils/helpers.js').validateDependencies;
}

export interface EmailMFA {
	bcrypt: typeof import('bcrypt');
	jwt: typeof import('jsonwebtoken');
	configService: typeof import('../services/configService.js').configService;
	validateDependencies: typeof import('../utils/helpers.js').validateDependencies;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	errorLogger: typeof import('../services/errorLogger.js').ErrorLogger;
	processError: typeof import('../errors/processError').processError;
}

export interface FidoUser {
	id: string;
	email: string;
	username: string;
	credential: {
		credentialId: string;
	}[];
}

export interface GeneratePasskeyAuthenticationOptions {
	user: FidoUser;
	configService: typeof import('../services/configService.js').configService;
	appLogger: import('../services/appLogger.js').AppLogger;
}

export interface GeneratePasskeyRegistrationOptions {
	user: FidoUser;
	configService: typeof import('../services/configService.js').configService;
	appLogger: import('../services/appLogger.js').AppLogger;
}

export interface HashPassword {
	password: string;
	configService: typeof import('../services/configService.js');
	appLogger: import('../services/appLogger.js').AppLogger;
}

export interface JwtUser {
	id: string;
	username: string;
}

export interface TOTPMFA {
	QRCode: typeof import('qrcode');
	speakeasy: typeof import('speakeasy');
	appLogger: import('../services/appLogger.js').AppLogger;
	configService: typeof import('../services/configService.js').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorLogger: typeof import('../services/errorLogger.js').ErrorLogger;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: typeof import('../utils/helpers.js').validateDependencies;
}

export interface TOTPSecret {
	ascii: string;
	hex: string;
	base32: string;
	otpauth_url: string;
}

export interface UserInstance {
	id: string;
	username: string;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2')
	) => Promise<boolean>;
}

export interface VerifyPasskeyAuthentication {
	assertion: import('fido2-lib').AssertionResult;
	expectedChallenge: string;
	publicKey: string;
	previousCounter: number;
	id: string;
	configService: typeof import('../services/configService.js').configService;
	appLogger: import('../services/appLogger.js').AppLogger;
}

export interface VerifyPasskeyRegistration {
	attestation: import('fido2-lib').AttestationResult;
	expectedChallenge: string;
	configService: typeof import('../services/configService.js').configService;
	appLogger: import('../services/appLogger.js').AppLogger;
}

export interface YubClient {
	verify(
		otp: string,
		callback: (err: Error | null, data: YubResponse) => void
	): void;
}

export interface YubicoOtpMFA {
	execSync: typeof import('child_process').execSync;
	getDirectoryPath: () => string;
	yub: typeof import('yub');
	appLogger: import('../services/appLogger.js').AppLogger;
	configService: typeof import('../services/configService.js').configService;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	ErrorLogger: typeof import('../services/errorLogger.js').ErrorLogger;
	processError: typeof import('../errors/processError').processError;
	validateDependencies: typeof import('../utils/helpers.js').validateDependencies;
}

export interface YubicoOtpOptions {
	clientId: number;
	apiKey: string;
	apiUrl: string;
}

export interface YubResponse {
	status: string;
	[key: string]: string | number | boolean | object | null | undefined;
}
