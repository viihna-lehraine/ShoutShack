import { NextFunction, Request, Response } from 'express';
import { AppError, ClientError } from '../../errors/ErrorClasses';
import { Sequelize } from 'sequelize';
import { AppLoggerServiceInterface } from './main';
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
//# sourceMappingURL=serviceComponents.d.ts.map
