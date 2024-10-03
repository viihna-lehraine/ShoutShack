import { CreationOptional, Model } from 'sequelize';

export interface AuditLogAttributes {
	auditId: string;
	id?: string | null;
	actionType: string;
	actionDescription?: string | null;
	affectedResource?: string | null;
	previousValue?: string | null;
	newValue?: string | null;
	ipAddress: string;
	userAgent: string;
	auditLogDate: Date;
	auditLogUpdateDate?: Date | null;
}

export interface BlotEntryAttributes {
	id: string;
	guestName?: string | null;
	guestEmail?: string | null;
	guestMessage: string;
	guestMessageStyles?: object | null;
	entryDate: Date;
}

export interface DataShareOptionsAttributes {
	id: string;
	trackingPixelOption: boolean;
	featureUsageOption: boolean;
	pageViewsOption: boolean;
	interactionDataOption: boolean;
	deviceTypeOption: boolean;
	browserInfoOption: boolean;
	operatingSystemOption: boolean;
	randomAnonSurveyOption: boolean;
	lastUpdated: Date;
}

export interface DeviceAttributes {
	deviceId: number; // primary key, auto-incremented
	id: string; // foreign key to the User model
	deviceName: string;
	deviceType: string;
	os: string;
	browser?: string | null;
	ipAddress: string;
	lastUsed: Date;
	isTrusted: boolean;
	creationDate: Date;
	lastUpdated: Date;
}

export interface ErrorLogAttributes {
	id: CreationOptional<number>; // primary key, auto-incremented
	name: string;
	message: string;
	statusCode?: number | null;
	severity: string;
	errorCode?: string | null;
	details?: string | Record<string, unknown> | null;
	timestamp: CreationOptional<Date>;
	count: number;
}

export interface FailedLoginAttemptsAttributes {
	attemptId: string; // primary key for the failed login attempt record
	id: string; // foreign key referencing the User model
	ipAddress: string;
	userAgent: string;
	attemptDate: Date;
	isLocked: boolean;
}

export interface FeedbackSurveyAttributes {
	surveyId: number;
	questionGeneralApproval?: number | null;
	questionServiceQuality?: number | null;
	questionEaseOfUse?: number | null;
	questionUserSupport?: number | null;
	questionHelpGuides?: number | null;
	questionIsPremiumUser?: boolean | null;
	questionPremiumValue?: number | null;
	questionLikelihoodToRecommend?: number | null;
	questionUsefulFeaturesAndAspects?: object | null;
	questionFeaturesThatNeedImprovement?: object | null;
	questionOpenEndedLikeTheMost?: string | null;
	questionOpenEndedWhatCanWeImprove?: string | null;
	questionDemoHeardAboutUs?: number | null;
	questionDemoAgeGroup?: number | null;
	questionDemoGender?: string | null;
	questionDemoRegion?: string | null;
	questionDemoLangPref?: string | null;
	questionFinalThoughts?: string | null;
	hasOptedInForFollowUp?: boolean | null;
	email?: string | null;
	surveyDate?: CreationOptional<Date>;
}

export interface MFASetupAttributes {
	mfaId: number; // primary key for MFA setup record, auto-incremented
	id: string; // UUID for MFA setup, primary key (from User model)
	method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
	secret?: string | null;
	publicKey?: string | null;
	counter?: number | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface RecoveryMethodAttributes {
	id: string; // UUID for recovery method, primary key (from User model)
	isRecoveryActive: boolean;
	recoveryId: string; // UUID for recovery method, primary key
	recoveryMethod?: 'email' | 'backupCodes' | null;
	backupCodes?: string[] | null;
	recoveryLastUpdated: Date;
}

export interface SecurityEventAttributes {
	id: string; // UUID for security event, primary key (from User model)
	eventId: string; // unique event ID, auto-incremented
	eventType: string;
	eventDescription?: string | null;
	ipAddress: string;
	userAgent: string;
	securityEventDate: Date;
	securityEventLastUpdated: Date;
}

export interface SupportRequestAttributes {
	id: string; // UUID for support request, primary key (from user model)
	email: string;
	supportTicketNumber: number; // unique support ticket number, auto-incremented
	supportType: string;
	supportContent: string;
	isSupportTicketOpen: boolean;
	supportTicketOpenDate: CreationOptional<Date>;
	supportTicketCloseDate?: Date | null;
}

export interface UserMFAAttributes {
	id: string; // UUID for the MFA record and primary key (from User model)
	isMfaEnabled: boolean;
	backupCodes?: string[] | null;
	isEmail2faEnabled: boolean;
	isTotp2faEnabled: boolean;
	isYubicoOtp2faEnabled: boolean;
	isU2f2faEnabled: boolean;
	isPasskeyEnabled: boolean;
	totpSecret: string | null;
	yubicoOtpPublicId: string | null;
	yubicoOtpSecretKey: string | null;
	fido2CredentialId: string | null;
	fido2PublicKey: string | null;
	fido2Counter: number | null;
	fido2AttestationFormat: string | null;
	passkeyCredentialId: string | null;
	passkeyPublicKey: string | null;
	passkeyCounter: number | null;
	passkeyAttestationFormat: string | null;
}

export interface UserSessionAttributes {
	id: string; // UUID for the session record, primary key (from User model)
	sessionId: number;
	ipAddress: string;
	userAgent: string;
	createdAt: Date;
	updatedAt?: Date | null;
	expiresAt: Date;
	isActive: boolean;
}

//
///
////
///// ***** SECONDARY INTERFACES *****
////
///
//

export interface ModelType extends Model {
	id?: number;
}

export interface ModelOperations<T> {
	new (): T;
	findAll: () => Promise<T[]>;
	create: (values: Partial<T>) => Promise<T>;
	destroy: (options: { where: { id: number } }) => Promise<number>;
}

export interface UserAttributesInterface {
	id: string;
	userId?: number | undefined;
	username: string;
	password: string;
	email: string;
	isVerified: boolean;
	resetPasswordToken?: string | null;
	resetPasswordExpires?: Date | null;
	isMfaEnabled: boolean;
	totpSecret?: string | null | undefined;
	email2faToken?: string | null | undefined;
	email2faTokenExpires?: Date | null | undefined;
	creationDate: Date;
}

export interface UserInstanceInterfaceA {
	id: string;
	userId?: number | undefined;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken: string | null;
	resetPasswordExpires: Date | null;
	isMfaEnabled: boolean;
	totpSecret?: string | null | undefined;
	creationDate: Date;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2')
	) => Promise<boolean>;
	save: () => Promise<void>;
}

export interface UserInstanceInterfaceB {
	id: string;
	userId?: number | undefined;
	username: string;
	password: string;
	isAccountVerified: boolean;
	totpSecret?: string | null | undefined;
	email2faToken?: string | null | undefined;
	email2faTokenExpires?: Date | null | undefined;
	comparePassword: (
		password: string,
		argon2: typeof import('argon2')
	) => Promise<boolean>;
}
