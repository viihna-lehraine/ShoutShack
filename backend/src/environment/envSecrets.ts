import { execSync } from 'child_process';
import path from 'path';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { configService } from '../config/configService';
import { appLogger } from '../utils/appLogger';

export interface SecretsDependencies {
	execSync: typeof execSync;
	getDirectoryPath: () => string;
	appLogger: appLogger;
}

export interface SecretsMap {
	[key: string]: string;
}

export function decryptSecretOnDemand(
	secretKey: string,
	dependencies: SecretsDependencies,
	encryptionKey: string
): string | null {
	const { execSync, getDirectoryPath, appLogger } = dependencies;
	try {
		const secretsPath = path.join(
			getDirectoryPath(),
			configService.getEnvVariables().secretsFilePath
		);

		const decryptedSecrets = execSync(
			`sops -d --output-type json --passphrase ${encryptionKey} ${secretsPath}`
		).toString();
		const secrets = JSON.parse(decryptedSecrets);

		if (secrets[secretKey]) {
			const secretValue = secrets[secretKey];
			appLogger.info(`Decrypted secret: ${secretKey}`);

			encryptSecretOnDemand(
				secretKey,
				secretValue,
				encryptionKey,
				dependencies
			);
			return secretValue;
		} else {
			appLogger.error(`Secret not found: ${secretKey}`);
			return null;
		}
	} catch (error) {
		const secretsError = new errorClasses.ConfigurationError(
			`Failed to retrieve secret for ${secretKey}: ${error instanceof Error ? error.message : String(error)}`,
			{
				originalError: error,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(secretsError);
		processError(secretsError);
		return null;
	}
}

export function encryptSecretOnDemand(
	secretKey: string,
	secretValue: string,
	encryptionKey: string,
	dependencies: SecretsDependencies
): void {
	const { execSync, getDirectoryPath, appLogger } = dependencies;
	try {
		const secretsPath = path.join(
			getDirectoryPath(),
			configService.getEnvVariables().secretsFilePath
		);

		const decryptedSecrets = execSync(
			`sops -d --output-type json --passphrase ${encryptionKey} ${secretsPath}`
		).toString();
		const secrets = JSON.parse(decryptedSecrets);

		secrets[secretKey] = secretValue;

		const updatedSecretsJson = JSON.stringify(secrets);

		execSync(
			`sops -e --input-type json --passphrase ${encryptionKey} ${secretsPath}`,
			{ input: updatedSecretsJson }
		);

		appLogger.info(`Secret ${secretKey} re-encrypted successfully.`);
	} catch (error) {
		const secretsError = new errorClasses.ConfigurationError(
			`Failed to re-encrypt secret ${secretKey}: ${error instanceof Error ? error.message : String(error)}`,
			{
				originalError: error,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(secretsError);
		processError(secretsError);
	}
}

export function getSecretsSync(
	{ execSync, getDirectoryPath, appLogger }: SecretsDependencies,
	encryptionKey: string
): SecretsMap {
	try {
		const secretsPath = path.join(
			getDirectoryPath(),
			configService.getEnvVariables().secretsFilePath
		);
		appLogger.info('Resolved secrets path:', secretsPath);

		const decryptedSecrets = execSync(
			`sops -d --output-type json --passphrase ${encryptionKey} ${secretsPath}`
		).toString();
		const secrets = JSON.parse(decryptedSecrets);

		appLogger.info('Secrets successfully decrypted');
		return {
			dbPassword: secrets.DB_PASSWORD,
			email2FAKey: secrets.EMAIL_2FA_KEY,
			jwtSecret: secrets.JWT_SECRET,
			pepper: secrets.PEPPER,
			sessionSecret: secrets.SESSION_SECRET,
			smtpToken: secrets.SMTP_TOKEN
		};
	} catch (error) {
		const secretsError = new errorClasses.ConfigurationErrorFatal(
			`Failed to retrieve secrets: ${error instanceof Error ? error.message : String(error)}`,
			{
				originalError: error,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(secretsError);
		processError(secretsError);
		throw secretsError;
	}
}

function decryptKeySync(
	{ execSync }: Pick<SecretsDependencies, 'appLogger' | 'execSync'>,
	encryptedFilePath: string
): string {
	try {
		const decryptedKey = execSync(
			`sops -d --output-type string ${encryptedFilePath}`
		).toString('utf-8');
		return decryptedKey;
	} catch (utilError) {
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Error occurred while decrypting key\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{
				utility: 'decryptKeySync',
				originalError: utilError,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(utilityError);
		processError(utilityError);
		return '';
	}
}

export function decryptDataFilesSync({ execSync }: SecretsDependencies): {
	[key: string]: string;
} {
	const appLogger = configService.getLogger();

	try {
		const filePaths = [
			configService.getEnvVariables().serverDataFilePath1,
			configService.getEnvVariables().serverDataFilePath2,
			configService.getEnvVariables().serverDataFilePath3,
			configService.getEnvVariables().serverDataFilePath4
		];

		const decryptedFiles: { [key: string]: string } = {};
		filePaths.forEach((filePath, index) => {
			if (filePath) {
				appLogger.info(`Decrypting file: ${filePath}`);
				const fileContent = execSync(
					`sops -d --output-type json ${filePath}`
				).toString();
				decryptedFiles[`files${index + 1}`] = fileContent;
			} else {
				appLogger.warn(`serverDataFilePath${index + 1} is not defined`);
			}
		});

		return decryptedFiles;
	} catch (error) {
		const configurationError = new errorClasses.ConfigurationErrorFatal(
			`Fatal error: Failed to decrypt data files\n${error instanceof Error ? error.message : String(error)}`,
			{
				originalError: error,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(configurationError);
		processError(configurationError);
		return {};
	}
}

export function getTLSKeysSync(dependencies: SecretsDependencies): {
	key: string;
	cert: string;
} {
	try {
		const keyPath = path.join(
			dependencies.getDirectoryPath(),
			configService.getEnvVariables().tlsKeyPath
		);
		const certPath = path.join(
			dependencies.getDirectoryPath(),
			configService.getEnvVariables().tlsCertPath
		);

		const cert = decryptKeySync(dependencies, certPath);
		const key = decryptKeySync(dependencies, keyPath);

		return { key, cert };
	} catch (error) {
		const configurationError = new errorClasses.ConfigurationErrorFatal(
			`Fatal error: Failed to retrieve TLS keys\n${error instanceof Error ? error.message : String(error)}`,
			{
				originalError: error,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(configurationError);
		processError(configurationError);
		return { key: '', cert: '' };
	}
}

export function maskSecrets(
	meta: Record<string, unknown>
): Record<string, unknown> {
	const maskedMeta: Record<string, unknown> = {};

	for (const key in meta) {
		if (Object.prototype.hasOwnProperty.call(meta, key)) {
			if (isSensitiveField(key)) {
				maskedMeta[key] = '***REDACTED***';
			} else {
				maskedMeta[key] = meta[key];
			}
		}
	}

	return maskedMeta;
}

function isSensitiveField(key: string): boolean {
	const sensitiveFields = [
		'dbPassword',
		'email2FAKey',
		'fidoChallengeSize',
		'jwtSecret',
		'pepper',
		'sessionSecret',
		'smtpToken',
		'yubicoClientId',
		'yubicoSecretKey'
	];

	return sensitiveFields.includes(key);
}
