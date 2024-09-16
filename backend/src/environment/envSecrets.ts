import { execSync } from 'child_process';
import path from 'path';
import { envVariables } from './envVars';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';

export interface EnvSecretsDependencies {
	appLogger: Logger;
	execSync: typeof execSync;
	getDirectoryPath: () => string;
}

interface EnvSecrets {
	[key: string]: string | number | boolean | string[] | number[] | boolean[];
}

export interface EnvSecretsMap extends EnvSecrets {
	APP_SSL_KEY: string;
	APP_SSL_CERT: string;
	DB_NAME: string;
	DB_USER: string;
	DB_PASSWORD: string;
	DB_HOST: string;
	DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
	EMAIL_2FA_KEY: string;
	EMAIL_HOST: string;
	EMAIL_PORT: number;
	EMAIL_SECURE: boolean;
	FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY: boolean;
	FIDO_AUTHENTICATOR_USER_VERIFICATION:
		| 'required'
		| 'preferred'
		| 'discouraged';
	FIDO_CHALLENGE_SIZE: number;
	FIDO_CRYPTO_PARAMETERS: number[];
	JWT_SECRET: string;
	PEPPER: string;
	RP_ID: string;
	RP_NAME: string;
	RP_ICON: string;
	SESSION_SECRET: string;
	SMTP_TOKEN: string;
	YUBICO_CLIENT_ID: number;
	YUBICO_SECRET_KEY: string;
}

export function getSecretsSync({
	appLogger,
	execSync,
	getDirectoryPath
}: EnvSecretsDependencies): EnvSecretsMap {
	try {
		validateDependencies(
			[{ name: 'appLogger', instance: appLogger }],
			appLogger
		);
		const secretsPath = path.join(
			getDirectoryPath(),
			envVariables.secretsFilePath
		);
		appLogger.info(`Resolved secrets path: ${secretsPath}`);

		const decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();
		return JSON.parse(decryptedSecrets);
	} catch (error) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to retrieve secrets: ${error instanceof Error ? error.message : String(error)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, appLogger);
		processError(configurationError, appLogger);
		throw configurationError;
	}
}

function decryptKeySync(
	{
		appLogger,
		execSync
	}: Pick<EnvSecretsDependencies, 'appLogger' | 'execSync'>,
	encryptedFilePath: string
): string {
	try {
		validateDependencies(
			[
				{ name: 'appLogger', instance: appLogger },
				{ name: 'execSync', instance: execSync }
			],
			appLogger
		);

		const decryptedKey = execSync(
			`sops -d --output-type string ${encryptedFilePath}`
		).toString('utf-8');
		return decryptedKey;
	} catch (utilError) {
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			`Failed to decrypt key: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(utilityError, appLogger);
		processError(utilityError, appLogger);
		return '';
	}
}

export function decryptDataFilesSync({
	appLogger,
	execSync
}: EnvSecretsDependencies): { [key: string]: string } {
	try {
		validateDependencies(
			[{ name: 'appLogger', instance: appLogger }],
			appLogger
		);

		const filePaths = [
			envVariables.serverDataFilePath1,
			envVariables.serverDataFilePath2,
			envVariables.serverDataFilePath3,
			envVariables.serverDataFilePath4
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
				appLogger.warn(
					`SERVER_DATA_FILE_PATH_${index + 1} is not defined`
				);
			}
		});

		return decryptedFiles;
	} catch (error) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to decrypt data files: ${error instanceof Error ? error.message : String(error)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, appLogger);
		processError(configurationError, appLogger);
		return {};
	}
}

export function getSSLKeysSync(dependencies: EnvSecretsDependencies): {
	key: string;
	cert: string;
} {
	try {
		validateDependencies(
			[{ name: 'appLogger', instance: dependencies.appLogger }],
			dependencies.appLogger
		);

		const keyPath = path.join(
			dependencies.getDirectoryPath(),
			envVariables.serverSslKeyPath
		);
		const certPath = path.join(
			dependencies.getDirectoryPath(),
			envVariables.serverSslCertPath
		);

		const key = decryptKeySync(dependencies, keyPath);
		const cert = decryptKeySync(dependencies, certPath);

		return { key, cert };
	} catch (error) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to get SSL keys: ${error instanceof Error ? error.message : String(error)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, dependencies.appLogger);
		processError(configurationError, dependencies.appLogger);
		return { key: '', cert: '' };
	}
}
