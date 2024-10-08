import { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { Transporter } from 'nodemailer';
import { UserAttributesInterface, UserMFAAttributes } from './models';
import {
	ErrorHandlerServiceInterface,
	MailerServiceInterface,
	UserControllerInterface
} from './services';

export interface APIRouterDeps {
	UserRoutes: UserControllerInterface;
	argon2: {
		hash(
			data: string | Buffer,
			options?: Record<string, unknown>
		): Promise<string>;
		verify(
			plain: string | Buffer,
			hash: string,
			options?: Record<string, unknown>
		): Promise<boolean>;
		argon2id: number;
	};
	jwt: typeof import('jsonwebtoken');
	axios: {
		get<T>(url: string, config?: object): Promise<{ data: T }>;
		post<T>(
			url: string,
			data?: unknown,
			config?: object
		): Promise<{ data: T }>;
		put<T>(
			url: string,
			data?: unknown,
			config?: object
		): Promise<{ data: T }>;
		delete<T>(url: string, config?: object): Promise<{ data: T }>;
	};
	bcrypt: typeof import('bcrypt');
	uuidv4: () => string;
	xss: (input: string) => string;
	generateConfirmationEmailTemplate: (
		userName: string,
		confirmationLink: string
	) => string;
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
	HandleErrorStaticParameters: typeof HandleErrorStaticParameters;
	fs: typeof import('fs');
	Sequelize: typeof import('sequelize').Sequelize;
	uuidv4: () => string;
}

export interface BackupCodeServiceDeps {
	UserMFA: UserMFAAttributes;
	crypto: typeof import('crypto');
	bcrypt: typeof import('bcrypt');
}

export interface EmailMFAServiceDeps {
	bcrypt: {
		genSalt: (rounds: number) => Promise<string>;
	};
	jwt: {
		sign: (
			payload: string | object | Buffer,
			secretOrPrivateKey: Secret,
			options?: SignOptions
		) => string;
		verify: (
			token: string,
			secretOrPublicKey: Secret
		) => string | JwtPayload;
	};
}

export interface ErrorLoggerServiceDeps {
	readonly validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
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
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface MulterUploadServiceDeps {
	multer: typeof import('multer');
	fileTypeFromBuffer: typeof import('file-type').fileTypeFromBuffer;
	fs: typeof import('fs');
	path: typeof import('path');
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
	logger: AppLoggerServiceInterface;
	errorLogger: AppLoggerServiceInterface;
	errorHandler: ErrorHandlerServiceInterface;
}

export interface PassportAuthMiddlewareServiceDeps {
	passport: import('passport').PassportStatic;
	authenticateOptions: import('passport').AuthenticateOptions;
	validateDependencies: (
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	) => void;
}

export interface PassportServiceInterface {
	configurePassport(
		passport: import('passport').PassportStatic,
		UserModel: UserAttributesInterface
	): Promise<void>;
	shutdown(): Promise<void>;
}

export interface UserControllerDeps {
	argon2: {
		hash(
			data: string | Buffer,
			options?: Record<string, unknown>
		): Promise<string>;
		verify(
			plain: string | Buffer,
			hash: string,
			options?: Record<string, unknown>
		): Promise<boolean>;
		argon2id: number;
	};
	jwt: typeof import('jsonwebtoken');
	bcrypt: typeof import('bcrypt');
	uuidv4: () => string;
	axios: {
		get<T>(url: string, config?: object): Promise<{ data: T }>;
		post<T>(
			url: string,
			data?: unknown,
			config?: object
		): Promise<{ data: T }>;
		put<T>(
			url: string,
			data?: unknown,
			config?: object
		): Promise<{ data: T }>;
		delete<T>(url: string, config?: object): Promise<{ data: T }>;
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
