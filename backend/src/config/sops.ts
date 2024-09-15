import { execSync } from 'child_process';
import path from 'path';
import { envVariables } from './envConfig';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { errorClasses } from 'src/errors/errorClasses';
import { ErrorLogger } from 'src/errors/errorLogger';

interface SopsDependencies {
	logger: Logger;
	execSync: typeof execSync;
	getDirectoryPath: () => string;
}

interface Secrets {
	[key: string]: string | number | boolean | string[] | number[] | boolean[];
}

export interface SecretsMap extends Secrets {
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

async function getSecrets({
	logger,
	execSync,
	getDirectoryPath
}: SopsDependencies): Promise<SecretsMap> {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'execSync', instance: execSync },
				{ name: 'getDirectoryPath', instance: getDirectoryPath }
			],
			logger || console
		);

		const secretsPath = path.join(
			getDirectoryPath(),
			envVariables.secretsFilePath
		);
		logger.info(`Resolved secrets path: ${secretsPath}`);
		const decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();
		return JSON.parse(decryptedSecrets);
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to retrieve secrets: ${configError instanceof Error ? configError.message : String(configError)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, logger);
		processError(configurationError, logger || console);
		return {} as SecretsMap;
	}
}

async function decryptKey(
	{ logger, execSync }: Pick<SopsDependencies, 'logger' | 'execSync'>,
	encryptedFilePath: string
): Promise<string> {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'execSync', instance: execSync }
			],
			logger
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
		ErrorLogger.logError(utilityError, logger);
		processError(utilityError, logger);
		return '';
	}
}

async function decryptDataFiles({
	logger,
	execSync
}: Pick<SopsDependencies, 'logger' | 'execSync'>): Promise<{
	[key: string]: string;
}> {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'execSync', instance: execSync }
			],
			logger
		);

		const filePaths: Array<string | undefined> = [
			envVariables.serverDataFilePath1,
			envVariables.serverDataFilePath2,
			envVariables.serverDataFilePath3,
			envVariables.serverDataFilePath4
		];

		const decryptedFilesPromises = filePaths.map(
			async (filePath, index) => {
				if (filePath) {
					logger.info(`Decrypting file: ${filePath}`);
					return execSync(
						`sops -d --output-type json ${filePath}`
					).toString();
				} else {
					logger.warn(
						`SERVER_DATA_FILE_PATH_${index + 1} is not defined`
					);
					return '';
				}
			}
		);

		const decryptedFilesArray = await Promise.all(decryptedFilesPromises);

		const decryptedFiles: { [key: string]: string } = {};
		decryptedFilesArray.forEach((fileContent, index) => {
			if (fileContent) {
				decryptedFiles[`files${index + 1}`] = fileContent;
			}
		});

		return decryptedFiles;
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to decrypt data files ${configError instanceof Error ? configError.message : String(configError)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, logger);
		processError(configurationError, logger);
		return {};
	}
}

async function getSSLKeys(
	dependencies: SopsDependencies
): Promise<{ key: string; cert: string }> {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: dependencies.logger },
				{ name: 'execSync', instance: dependencies.execSync },
				{
					name: 'getDirectoryPath',
					instance: dependencies.getDirectoryPath
				}
			],
			dependencies.logger
		);

		const keyPath = path.join(
			dependencies.getDirectoryPath(),
			envVariables.serverSslKeyPath
		);

		const certPath = path.join(
			dependencies.getDirectoryPath(),
			'envVariables.serverSslCertPath'
		);

		const decryptedKey = await decryptKey(
			{ logger: dependencies.logger, execSync: dependencies.execSync },
			keyPath
		);

		const decryptedCert = await decryptKey(
			{ logger: dependencies.logger, execSync: dependencies.execSync },
			certPath
		);

		return {
			key: decryptedKey,
			cert: decryptedCert
		};
	} catch (configError) {
		const configurationError = new errorClasses.ConfigurationError(
			`Failed to get SSL keys: ${configError instanceof Error ? configError.message : String(configError)}`,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(configurationError, dependencies.logger);
		processError(configurationError, dependencies.logger);
		return {
			key: '',
			cert: ''
		};
	}
}

export default { getSecrets, decryptKey, decryptDataFiles, getSSLKeys };
