import { execSync } from 'child_process';
import path from 'path';

interface SopsDependencies {
	logger: ReturnType<typeof import('../config/logger').default>;
	execSync: typeof execSync;
	getDirectoryPath: () => string;
}

interface Secrets {
	[key: string]: string | number | boolean | string[] | number[] | boolean[];
}

export interface SecretsMap extends Secrets {
	APP_SSL_KEY: string;
	APP_SSL_CERT: string;
	DB_SSL_KEY: string;
	DB_SSL_CERT: string;
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
		const secretsPath = path.join(
			getDirectoryPath(),
			'./config/secrets.json.gpg'
		);
		logger.info(`Resolved secrets path: ${secretsPath}`);
		const decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();
		return JSON.parse(decryptedSecrets);
	} catch (err) {
		logger.info(`Error retrieving secrets from SOPS: ${err}`);
		throw err;
	}
}

async function decryptKey(
	{ logger, execSync }: Pick<SopsDependencies, 'logger' | 'execSync'>,
	encryptedFilePath: string
): Promise<string> {
	try {
		const decryptedKey = execSync(
			`sops -d --output-type string ${encryptedFilePath}`
		).toString('utf-8');
		return decryptedKey;
	} catch (err) {
		logger.error(`Error decrypting key: ${err}`);
		throw err;
	}
}

async function decryptDataFiles({
	logger,
	execSync
}: Pick<SopsDependencies, 'logger' | 'execSync'>): Promise<{
	[key: string]: string;
}> {
	try {
		const filePaths = [
			process.env.SERVER_DATA_FILE_PATH_1,
			process.env.SERVER_DATA_FILE_PATH_2,
			process.env.SERVER_DATA_FILE_PATH_3,
			process.env.SERVER_DATA_FILE_PATH_4
		];

		const decryptedFiles: { [key: string]: string } = {};

		for (const [index, filePath] of filePaths.entries()) {
			if (filePath) {
				decryptedFiles[`files${index + 1}`] = execSync(
					`sops -d --output-type json ${filePath}`
				).toString();
			} else {
				logger.warn(
					`SERVER_DATA_FILE_PATH_${index + 1} is not defined`
				);
			}
		}

		return decryptedFiles;
	} catch (err) {
		logger.error(
			`Error decrypting data files from backend data folder: ${err}`
		);
		throw err;
	}
}

async function getSSLKeys(
	dependencies: SopsDependencies
): Promise<{ key: string; cert: string }> {
	const { logger, execSync, getDirectoryPath } = dependencies;
	try {
		const keyPath = path.join(
			getDirectoryPath(),
			'./keys/ssl/guestbook_key.pem.gpg'
		);
		const certPath = path.join(
			getDirectoryPath(),
			'./keys/ssl/guestbook_cert.pem.gpg'
		);
		const decryptedKey = await decryptKey({ logger, execSync }, keyPath);
		const decryptedCert = await decryptKey({ logger, execSync }, certPath);

		return {
			key: decryptedKey,
			cert: decryptedCert
		};
	} catch (err) {
		logger.error(
			`Error decrypting SSL keys from backend keys folder: ${err}`
		);
		throw err;
	}
}

export default { getSecrets, decryptKey, decryptDataFiles, getSSLKeys };
