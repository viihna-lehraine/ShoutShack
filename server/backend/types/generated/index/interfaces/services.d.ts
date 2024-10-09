import type { Application, RequestHandler, Router } from 'express';
import { Session } from 'express-session';
import type { User } from '../../models/User';
import type { AttestationResult, Fido2AttestationResult, PublicKeyCredentialCreationOptions, PublicKeyCredentialRequestOptions } from 'fido2-lib';
import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError } from '../../errors/ErrorClasses';
import { Sequelize } from 'sequelize';
import { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { Transporter } from 'nodemailer';
import type { InferAttributes, WhereOptions } from 'sequelize';
import { Logger as WinstonLogger } from 'winston';
import { ErrorClasses } from '../../errors/ErrorClasses';
import { SecretsMap } from './env';
import { ModelOperations, UserInstanceInterface } from './models';
import { EnvVariableTypes, FeatureFlagTypes } from './env';
import { UserAttributesInterface } from './models';
import { RedisClientType } from 'redis';
export interface AccessControlMiddlewareServiceInterface {
    restrictTo(...allowedRoles: string[]): RequestHandler;
    hasPermission(...requiredPermissions: string[]): RequestHandler;
    shutdown(): Promise<void>;
}
export interface AppLoggerServiceInterface extends WinstonLogger {
    getRedactedLogger(): AppLoggerServiceInterface;
    logDebug(message: string, details?: Record<string, unknown>): void;
    logInfo(message: string, details?: Record<string, unknown>): void;
    logNotice(message: string, details?: Record<string, unknown>): void;
    logWarn(message: string, details?: Record<string, unknown>): void;
    logError(message: string, details?: Record<string, unknown>): void;
    logCritical(message: string, details?: Record<string, unknown>): void;
    cleanUpOldLogs(sequelize: Sequelize, retentionPeriodDays?: number): Promise<void>;
    setAdminId(adminId: number | null): void;
    getErrorDetails(getCallerInfo: () => string, action: string, req?: Request, userId?: string | null, additionalData?: Record<string, unknown>): Record<string, unknown>;
    setUpSecrets(secrets: VaultServiceInterface): void;
    setErrorHandler(errorHandler: ErrorHandlerServiceInterface): void;
    shutdown(): Promise<void>;
}
export interface AuthControllerInterface {
    initializeAuthMiddleware(): Promise<void>;
    initializeJWTAuthMiddleware(): RequestHandler;
    initializePassportAuthMiddleware(): RequestHandler;
    loginUser(email: string, password: string): Promise<{
        success: boolean;
        token?: string;
    }>;
    generateResetToken(user: UserInstanceInterface): Promise<string | null>;
    validateResetToken(userId: string, token: string): Promise<UserInstanceInterface | null>;
    comparePassword(user: UserInstanceInterface, password: string): Promise<boolean>;
    resetPassword(user: UserInstanceInterface, newPassword: string): Promise<UserInstanceInterface | null>;
    enableMfa(userId: string): Promise<boolean>;
    disableMfa(userId: string): Promise<boolean>;
    recoverPassword(email: string): Promise<void>;
    generateEmailMFACode(email: string): Promise<boolean>;
    verifyEmailMFACode(email: string, email2FACode: string): Promise<boolean>;
    generateTOTP(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    verifyTOTP(userId: string, token: string): Promise<boolean>;
    shutdown(): Promise<void>;
}
export interface BaseRouterInterface {
    getRouter(): Router;
    shutdown(): Promise<void>;
}
export interface BackupCodeServiceInterface {
    generateBackupCodes(id: string): Promise<string[]> | string[];
    verifyBackupCode(id: string, inputCode: string): Promise<boolean>;
    saveBackupCodesToDatabase(id: string, backupCodes: BackupCodeInterface[]): Promise<void>;
    getBackupCodesFromDatabase(id: string): Promise<BackupCodeInterface[] | undefined>;
    updateBackupCodesInDatabase(id: string, backupCodes: BackupCodeInterface[]): Promise<void>;
    shutdown(): Promise<void>;
}
export interface CacheServiceInterface {
    getCacheMetrics(service: string): CacheMetrics;
    getMemoryCache(service: string): Map<string, {
        value: unknown;
        expiration: number | undefined;
    }> | null;
    get<T>(key: string, service: string): Promise<T | null>;
    set<T>(key: string, value: T, service: string, expirationInSeconds?: number): Promise<void>;
    del(key: string, service: string): Promise<void>;
    exists(key: string, service: string): Promise<boolean>;
    cleanupExpiredEntries(): void;
    flushCache(service: string): Promise<void>;
    clearNamespace(service: string): Promise<void>;
    closeConnection(): Promise<void>;
    shutdown(): Promise<void>;
}
export interface CSRFMiddlewareServiceInterface {
    initializeCSRFMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    shutdown(): void;
}
export interface DatabaseControllerInterface {
    initialize(): Promise<Sequelize>;
    getSequelizeInstance(): Sequelize | null;
    clearIdleConnections(): Promise<void>;
    getEntries<T>(Model: ModelOperations<T>): Promise<T[]>;
    createEntry<T>(Model: ModelOperations<T>, data: T): Promise<T>;
    deleteEntry<T>(Model: ModelOperations<T>, id: number): Promise<boolean>;
    cacheData<T>(key: string, data: T, expiration?: number): Promise<void>;
    queryWithCache<T extends object>(query: string, cacheKey: string, expiration?: number): Promise<T | null>;
    getCachedData<T>(key: string): Promise<T | null>;
    clearCache(key: string): Promise<void>;
    getDatabaseInfo(): Promise<Record<string, unknown>>;
    getDatabaseMetrics(serviceName: string): Promise<Record<string, unknown>>;
    shutdown(): Promise<void>;
}
export interface EmailMFAServiceInterface {
    generateEmailMFACode({ bcrypt, jwt }: EmailMFAServiceDeps): Promise<{
        emailMFACode: string;
        emailMFAToken: string;
    }>;
    verifyEmailMFACode(token: string, emailMFACode: string, jwt: EmailMFAServiceDeps['jwt']): Promise<boolean>;
    shutdown(): Promise<void>;
}
export interface EnvConfigServiceInterface {
    getEnvVariable<K extends keyof EnvVariableTypes>(key: K): EnvVariableTypes[K];
    getFeatureFlags(): FeatureFlagTypes;
    shutdown(): Promise<void>;
}
export interface ErrorLoggerServiceInterface extends AppLoggerServiceInterface {
    logAppError(error: Error, sequelize?: Sequelize, details?: Record<string, unknown>): void;
    logToDatabase(error: Error, sequelize: Sequelize, retryCount?: number): Promise<void>;
    getErrorCount(errorName: string): number;
}
export interface ErrorHandlerServiceInterface {
    ErrorClasses: typeof ErrorClasses;
    ErrorSeverity: typeof import('../../errors/ErrorClasses').ErrorSeverity;
    handleError(params: {
        error: unknown;
        req?: Request;
        details?: Record<string, unknown>;
        severity?: import('../../errors/ErrorClasses').ErrorSeverityType;
        action?: string;
        userId?: string;
        sequelize?: Sequelize;
    }): void;
    expressErrorHandler(): (err: AppError | ClientError | Error | Record<string, unknown>, req: Request, res: Response, next: NextFunction) => void;
    handleCriticalError(params: {
        error: unknown;
        req?: Request;
        details?: Record<string, unknown>;
    }): void;
    sendClientErrorResponse(params: {
        message: string;
        statusCode?: number;
        res: Response;
        responseId?: string;
    }): Promise<void>;
    initializeGlobalErrorHandlers(): void;
    setShutdownHandler(shutdownFn: () => Promise<void>): void;
    shutdown(): Promise<void>;
}
export interface FIDO2ServiceInterface {
    initializeFIDO2Service(): Promise<void>;
    generateFIDO2RegistrationOptions(user: FidoUserInterface): Promise<PublicKeyCredentialCreationOptions>;
    verifyFIDO2Registration(attestation: AttestationResult, expectedChallenge: string): Promise<Fido2AttestationResult>;
    generateFIDO2AuthenticationOptions(user: FidoUserInterface): Promise<PublicKeyCredentialRequestOptions>;
    invalidateFido2Cache(userId: string, action: string): Promise<void>;
    shutdown(): Promise<void>;
}
export interface GatekeeperServiceInterface {
    initialize(): Promise<void>;
    rateLimitMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    slowdownMiddleware(): (req: Request & {
        session: Session & {
            lastRequestTime?: number;
        };
    }, res: Response, next: NextFunction) => void;
    throttleRequests(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
    ipBlacklistMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    addIpToBlacklist(ip: string): Promise<void>;
    removeIpFromBlacklist(ip: string): Promise<void>;
    preInitIpBlacklist(): Promise<void>;
    loadIpBlacklist(): Promise<void>;
    temporaryBlacklist(ip: string): Promise<void>;
    isBlacklisted(ip: string): Promise<boolean>;
    isTemporarilyBlacklisted(ip: string): Promise<boolean>;
    isBlacklistedOrTemporarilyBlacklisted(ip: string): Promise<{
        isBlacklisted: boolean;
        isTemporarilyBlacklisted: boolean;
    }>;
    dynamicRateLimiter(): Promise<void>;
    shutdown(): Promise<void>;
}
export interface HealthCheckServiceInterface {
    performHealthCheck(): Promise<Record<string, unknown>>;
    shutdown(): Promise<void>;
}
export interface HelmetMiddlewareServiceInterface {
    initializeHelmetMiddleware(app: Application): Promise<void>;
    applyHelmet(app: Application): Promise<void>;
    applyCSP(app: Application): Promise<void>;
    applyExpectCT(app: Application): Promise<void>;
    applyReferrerPolicy(app: Application): Promise<void>;
    applyPermissionsPolicy(app: Application): Promise<void>;
    applyXssFilter(app: Application): Promise<void>;
    helmetOptions?: typeof import('../../config/middlewareOptions').helmetOptions;
    permissionsPolicyOptions?: {
        [key: string]: string[];
    };
    shutdown(): Promise<void>;
}
export interface HTTPSServerInterface {
    initialize: () => Promise<void>;
    startServer: () => Promise<void>;
    getHTTPSServerInfo(): Promise<Record<string, unknown>>;
    getHTTPSServerMetrics(serviceName: string): Promise<Record<string, unknown>>;
    shutdownServer: () => Promise<void>;
}
export interface JWTAuthMiddlewareServiceInterface {
    initializeJWTAuthMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
    shutdown(): Promise<void>;
}
export interface JWTServiceInterface {
    generateJWT(id: string, username: string): Promise<string>;
    verifyJWT(token: string): Promise<string | JwtPayload | null>;
    shutdown(): Promise<void>;
}
export interface MailerServiceInterface {
    getTransporter(): Promise<Transporter>;
    validateMailerDependencies(): void;
    createMailTransporter(): Promise<Transporter>;
    shutdown(): Promise<void>;
}
export interface MiddlewareStatusServiceInterface {
    setStatus(middlewareName: string, status: 'on' | 'off'): void;
    getStatus(middlewareName: string): 'on' | 'off' | undefined | void;
    isMiddlewareOn(middlewareName: string): boolean;
    shutdown(): Promise<void>;
}
export interface MulterUploadServiceInterface {
    setFileSizeLimit(limit: number): void;
    setAllowedMimeTypes(mimeTypes: string[]): void;
    setAllowedExtensions(extensions: string[]): void;
    createMulterUpload(validationCallback?: (file: Express.Multer.File) => boolean): import('multer').Multer | undefined;
    onUploadSuccess(callback: (file: Express.Multer.File) => void): void;
    shutdown(): void;
}
export interface PassportAuthMiddlewareServiceInterface {
    initializePassportAuthMiddleware({ passport, authenticateOptions, validateDependencies }: PassportAuthMiddlewareServiceDeps): RequestHandler;
    shutdown(): Promise<void>;
}
export interface PassportServiceInterface {
    configurePassport(passport: import('passport').PassportStatic, UserModel: typeof import('../../models/User').User): Promise<void>;
    shutdown(): Promise<void>;
}
export interface PasswordServiceInterface {
    hashPassword(password: string, pepper: string): Promise<string>;
    comparePassword(storedPassword: string, providedPassword: string, pepper: string): Promise<boolean>;
    shutdown(): Promise<void>;
}
export interface RedisServiceInterface {
    getRedisClient(): Promise<RedisClientType | null>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, expiration?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    increment(key: string, expiration?: number): Promise<number | null>;
    flushRedisMemoryCache(): Promise<void>;
    cleanUpRedisClient(): Promise<void>;
    delMultiple(service: string, keys: string[]): Promise<void>;
    getKeysByPattern(pattern: string): Promise<string[]>;
    flushCacheByService(service: string): Promise<void>;
    getRedisInfo(): Promise<RedisMetrics>;
    shutdown(): Promise<void>;
}
export interface ResourceManagerInterface {
    getCpuUsage(): Array<{
        core: number;
        usage: string;
    }>;
    getMemoryUsage(): {
        heapUsed: number;
        heapTotal: number;
        heapUsedPercentage: number;
        memoryLimit: number;
        isMemoryHealthy: boolean;
    };
    getDiskUsage(): Promise<Record<string, unknown>>;
    getNetworkUsage(): Record<string, unknown>[];
    adjustResources(): void;
    clearCaches(service: string): Promise<void>;
    evictCacheEntries(service: string): void;
    closeIdleConnections(): Promise<void>;
    saveToCache<T>(key: string, value: T, service: string, expiration: number): Promise<void>;
    getFromCache<T>(key: string, service: string): Promise<T | null>;
    shutdown(): Promise<void>;
}
export interface RootMiddlewareServiceInterface {
    initialize(): Promise<void>;
    trackResponseTime(req: Request, res: Response, next: NextFunction): void;
    calculateRequestsPerSecond(): void;
    shutdown(): Promise<void>;
    getAverageResponseTime(): number;
}
export interface StaticRouterInterface {
    initializeStaticRouter(): Promise<void>;
    serveNotFoundPage(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export interface TOTPServiceInterface {
    generateTOTPSecret(): TOTPSecretInterface;
    generateTOTPToken(secret: string): Promise<string>;
    verifyTOTPToken(secret: string, token: string): boolean;
    generateQRCode(otpauth_url: string): Promise<string>;
    shutdown(): Promise<void>;
}
export interface UserControllerInterface {
    findOne(criteria: WhereOptions<InferAttributes<User>>): Promise<UserInstanceInterface | null>;
    findUserByEmail(email: string): Promise<UserInstanceInterface | null>;
    findUserById(userId: string): Promise<UserInstanceInterface | null>;
    createUser(userDetails: Omit<UserAttributesInterface, 'id' | 'creationDate'>): Promise<UserInstanceInterface | null>;
    updateUser(user: UserInstanceInterface, updatedDetails: Partial<UserInstanceInterface>): Promise<UserInstanceInterface | null>;
    deleteUser(userId: string): Promise<boolean>;
    verifyUserAccount(userId: string): Promise<boolean>;
    shutdown(): Promise<void>;
}
export interface VaultServiceInterface {
    storeSecret(key: string, secret: string): Promise<void>;
    retrieveSecret(key: keyof SecretsMap, usageCallback: (secret: string) => void): Promise<string | null>;
    retrieveSecrets(secretKeys: (keyof SecretsMap)[], usageCallback: (secrets: Partial<SecretsMap>) => void): Promise<Partial<SecretsMap> | null>;
    redactSecrets(logData: string | Record<string, unknown> | unknown[]): Promise<string | Record<string, unknown> | unknown[]>;
    clearExpiredSecretsFromMemory(): void;
    clearSecretsFromMemory(secretKeys: string | string[]): void;
    batchClearSecrets(): Promise<void>;
    shutdown(): Promise<void>;
}
export interface ValidatorServiceInterface {
    validateEntry(req: Request, res: Response, next: NextFunction): void;
    registrationValidationRules(req: Request, res: Response, next: NextFunction): void;
    handleValidationErrors(req: Request, res: Response, next: NextFunction): Response | void;
}
export interface YubicoOTPServiceInterface {
    initializeYubicoOTP(): Promise<void>;
    init(clientId: string, secretKey: string): YubClientInterface;
    validateYubicoOTP(otp: string): Promise<boolean>;
    generateYubicoOTPOptions(): Promise<YubicoOTPOptionsInterface>;
    shutdown(): Promise<void>;
}
import '../../../types/custom/winston-logstash';
export interface APIRouterDeps {
    UserRoutes: UserControllerInterface;
    argon2: {
        hash(data: string | Buffer, options?: Record<string, unknown>): Promise<string>;
        verify(plain: string | Buffer, hash: string, options?: Record<string, unknown>): Promise<boolean>;
        argon2id: number;
    };
    jwt: typeof import('jsonwebtoken');
    axios: {
        get<T>(url: string, config?: object): Promise<{
            data: T;
        }>;
        post<T>(url: string, data?: unknown, config?: object): Promise<{
            data: T;
        }>;
        put<T>(url: string, data?: unknown, config?: object): Promise<{
            data: T;
        }>;
        delete<T>(url: string, config?: object): Promise<{
            data: T;
        }>;
    };
    bcrypt: typeof import('bcrypt');
    uuidv4: () => string;
    xss: (input: string) => string;
    generateConfirmationEmailTemplate: (userName: string, confirmationLink: string) => string;
    getTransporter: (deps: MailerServiceInterface) => Promise<Transporter>;
    totpMfa: {
        generateTOTPSecret: () => TOTPSecretInterface;
        generateTOTPToken: (secret: string) => string;
        verifyTOTPToken: (secret: string, token: string) => boolean;
        generateQRCode: (otpauth_url: string) => Promise<string>;
    };
    zxcvbn: (password: string) => {
        score: number;
        guesses: number;
    };
}
export interface AppLoggerServiceDeps {
    winston: {
        createLogger: typeof import('winston').createLogger;
        format: typeof import('winston').format;
        transports: typeof import('winston').transports;
        addColors: typeof import('winston').addColors;
    };
    DailyRotateFile: typeof import('winston-daily-rotate-file');
    LogStashTransport: typeof import('winston-logstash');
    ErrorClasses: typeof import('../../errors/ErrorClasses').ErrorClasses;
    HandleErrorStaticParameters: typeof import('../parameters').HandleErrorStaticParameters;
    uuidv4: typeof import('uuid').v4;
    fs: typeof import('fs');
    Sequelize: typeof import('sequelize').Sequelize;
}
export interface BackupCodeServiceDeps {
    UserMFA: typeof import('../../models/UserMFA').UserMFA;
    crypto: typeof import('crypto');
    bcrypt: typeof import('bcrypt');
}
export interface EmailMFAServiceDeps {
    bcrypt: {
        genSalt: (rounds: number) => Promise<string>;
    };
    jwt: {
        sign: (payload: string | object | Buffer, secretOrPrivateKey: Secret, options?: SignOptions) => string;
        verify: (token: string, secretOrPublicKey: Secret) => string | JwtPayload;
    };
}
export interface ErrorLoggerServiceDeps {
    readonly validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
    readonly ErrorClasses: typeof import('../../errors/ErrorClasses').ErrorClasses;
    readonly ErrorSeverity: string;
    readonly handleError: ErrorHandlerServiceInterface['handleError'];
}
export interface HTTPSServerDeps {
    app: import('express').Application;
    blankRequest: import('express').Request;
    DeclareWebServerOptionsStaticParameters: DeclareWebServerOptionsInterface;
    sequelize: import('sequelize').Sequelize | null;
}
export interface MailerServiceDeps {
    nodemailer: typeof import('nodemailer');
    emailUser: string;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface MulterUploadServiceDeps {
    multer: typeof import('multer');
    fileTypeFromBuffer: typeof import('file-type').fileTypeFromBuffer;
    fs: typeof import('fs');
    path: typeof import('path');
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
    logger: AppLoggerServiceInterface;
    errorLogger: AppLoggerServiceInterface;
    errorHandler: ErrorHandlerServiceInterface;
}
export interface PassportAuthMiddlewareServiceDeps {
    passport: import('passport').PassportStatic;
    authenticateOptions: import('passport').AuthenticateOptions;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface PassportServiceInterface {
    configurePassport(passport: import('passport').PassportStatic, UserModel: typeof import('../../models/User').User): Promise<void>;
    shutdown(): Promise<void>;
}
export interface RedisServiceDeps {
    req: import('express').Request;
    res: import('express').Response;
    next: import('express').NextFunction;
    createRedisClient: typeof import('redis').createClient;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
    blankRequest: import('express').Request;
}
export interface UserControllerDeps {
    argon2: {
        hash(data: string | Buffer, options?: Record<string, unknown>): Promise<string>;
        verify(plain: string | Buffer, hash: string, options?: Record<string, unknown>): Promise<boolean>;
        argon2id: number;
    };
    jwt: typeof import('jsonwebtoken');
    bcrypt: typeof import('bcrypt');
    uuidv4: () => string;
    axios: {
        get<T>(url: string, config?: object): Promise<{
            data: T;
        }>;
        post<T>(url: string, data?: unknown, config?: object): Promise<{
            data: T;
        }>;
        put<T>(url: string, data?: unknown, config?: object): Promise<{
            data: T;
        }>;
        delete<T>(url: string, config?: object): Promise<{
            data: T;
        }>;
    };
    xss: (input: string) => string;
    zxcvbn: (password: string) => {
        score: number;
        guesses: number;
    };
    totpMfa: {
        generateTOTPSecret: () => TOTPSecretInterface;
        generateTOTPToken: (secret: string) => string;
        verifyTOTPToken: (secret: string, token: string) => boolean;
        generateQRCode: (otpauth_url: string) => Promise<string>;
    };
}
export interface AddIpToBlacklistInterface {
    ip: string;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface AuthenticatedUserInterface {
    id: string;
    role: string;
    permissions: string[];
}
export interface BackupCodeInterface {
    code: string;
    used: boolean;
}
export interface CacheMetrics {
    cacheHits: number;
    cacheMisses: number;
    cacheSize?: number;
}
export interface ConfigSecretsInterface {
    readonly execSync: typeof import('child_process').execSync;
    readonly getDirectoryPath: () => string;
    readonly gpgPassphrase: string;
}
export interface CreateJwtInterface {
    jwt: typeof import('jsonwebtoken');
    execSync: typeof import('child_process').execSync;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface CsrfMiddlewareInterface {
    req: import('express').Request;
    res: import('express').Response;
    next: import('express').NextFunction;
}
export interface DeclareWebServerOptionsInterface {
    blankRequest: import('express').Request;
    constants: typeof import('crypto').constants;
    fs: typeof import('fs').promises;
    tlsCiphers: string[];
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface DependencyInterface {
    name: string;
    instance: unknown;
}
export interface ExpressErrorHandlerInterface {
    expressError: AppError | ClientError | Error;
    req: Request;
    res: Response;
    next: NextFunction;
    fallbackLogger: Console;
    errorResponse?: string;
}
export interface ErrorLoggerDetailsInterface {
    getCallerInfo: () => string;
    req: import('express').Request;
    requestIdVal?: string;
    adminIdVal?: string;
    userIdVal?: string;
    actionVal?: string;
    ipVal?: string;
    userAgentVal?: string;
}
export interface FidoUserInterface {
    id: string;
    email: string;
    username: string;
    credential: {
        credentialId: string;
    }[];
}
export interface FileTypeRecords {
    [key: string]: string | string[];
}
export interface FlushRedisMemoryCacheInterface {
    readonly req: import('express').Request;
    readonly res: import('express').Response;
    readonly next: import('express').NextFunction;
    readonly blankRequest: import('express').Request;
    readonly createRedisClient: typeof import('redis').createClient;
}
export interface GetFeatureFlagsInterface {
    blankRequest: import('express').Request;
}
export interface GeneratePasskeyInterface {
    user: FidoUserInterface;
}
export interface GeneratePasskeyInterface {
    user: FidoUserInterface;
    logger: AppLoggerServiceInterface;
}
export interface GetRedisClientInterface {
    readonly req: import('express').Request;
    readonly res: import('express').Response;
    readonly next: import('express').NextFunction;
    readonly blankRequest: import('express').Request;
    readonly createRedisClient: typeof import('redis').createClient;
}
export interface HandleCriticalErrorInterface {
    error: unknown;
    req?: Request;
    details?: Record<string, unknown>;
}
export interface HandleErrorInterface {
    error: unknown;
    req?: Request;
    details?: Record<string, unknown>;
    severity?: import('../../errors/ErrorClasses').ErrorSeverityType;
    action?: string;
    userId?: string;
    sequelize?: Sequelize;
}
export interface HashPasswordInterface {
    password: string;
}
export interface InitDatabaseInterface {
    maxRetries: number;
    retryAfter: number;
}
export interface InitializeDatabaseInterface {
    readonly blankRequest: import('express').Request;
}
export interface InitExpressMiddlware {
    app: import('express').Application;
    middleware: import('express').RequestHandler;
    middlewareName: string;
}
export interface InitIpBlacklistInterface {
    fsModule: typeof import('fs');
    inRange: typeof import('range_check').inRange;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface LoadIpBlacklistInterface {
    fsModule: typeof import('fs').promises;
}
export interface MailOptions {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
export interface MemoryMonitorInterface {
    os: typeof import('os');
    process: NodeJS.Process;
    setInterval: typeof setInterval;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface MemoryMonitorStats {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    available: string;
}
export interface RedisMetrics {
    uptime_in_seconds: number;
    used_memory: number;
    connected_clients: number;
    db0_size?: number;
}
export interface RouteParams {
    app: import('express').Application;
}
export interface SendClientErrorResponseInterface {
    message: string;
    statusCode: number;
    res: Response;
}
export interface SetUpDatabaseInterface {
    readonly blankRequest?: import('express').Request;
}
export interface SlowdownConfigInterface {
    slowdownThreshold: number;
    validateDependencies: (dependencies: DependencyInterface[], logger: AppLoggerServiceInterface) => void;
}
export interface TLSKeys {
    cert: string;
    key: string;
}
export interface TOTPMFA {
    QRCode: typeof import('qrcode');
    speakeasy: typeof import('speakeasy');
}
export interface TOTPSecretInterface {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url: string;
}
export interface ValidatorInterface {
    validator: typeof import('validator');
}
export interface ValidateDependenciesInterface {
    validateDependencies(dependencies: DependencyInterface[], logger: AppLoggerServiceInterface): void;
}
export interface ValidFiles {
    cssFiles: FileTypeRecords;
    fontFiles: FileTypeRecords;
    htmlFiles: FileTypeRecords;
    iconFiles: FileTypeRecords;
    imageFiles: FileTypeRecords;
    jsFiles: FileTypeRecords;
    logoFiles: FileTypeRecords;
    mdFiles: FileTypeRecords;
    txtFiles: FileTypeRecords;
    xmlFiles: FileTypeRecords;
}
export interface VerifyPasskeyAuthInterface {
    assertion: import('fido2-lib').AssertionResult;
    expectedChallenge: string;
    publicKey: string;
    previousCounter: number;
    id: string;
}
export interface VerifyPasskeyRegistrationInterface {
    attestation: import('fido2-lib').AttestationResult;
    expectedChallenge: string;
}
export interface XMLParsedRequest extends Request {
    parsedXmlBody?: Record<string, unknown>;
}
export interface YubClientInterface {
    verify(otp: string, callback: (err: Error | null, data: YubResponseInterface) => void): void;
}
export interface YubicoOTPOptionsInterface {
    clientId: number;
    apiKey: string;
    apiUrl: string;
}
export interface YubResponseInterface {
    status: string;
    [key: string]: string | number | boolean | object | null | undefined;
}
//# sourceMappingURL=services.d.ts.map
