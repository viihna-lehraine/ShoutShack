import { execSync } from 'child_process';
import path from 'path';

interface SopsDependencies {
	logger: ReturnType<typeof import('./logger').default>;
	execSync: typeof execSync;
	getDirectoryPath: () => string;
}

function getDirectoryPath() {
	return path.resolve(process.cwd());
}

async function getSecrets({ logger, execSync, getDirectoryPath }: SopsDependencies) {
	try {
		const secretsPath = path.join(
			getDirectoryPath(),
			'../../config/secrets.json.gpg'
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

async function decryptKey({ logger, execSync }: Pick<SopsDependencies, 'logger' | 'execSync'>, encryptedFilePath: string) {
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

async function decryptDataFiles({ logger, execSync }: Pick<SopsDependencies, 'logger' | 'execSync'>) {
	try {
		const filePaths = [
			process.env.SERVER_DATA_FILE_PATH_1,
			process.env.SERVER_DATA_FILE_PATH_2,
			process.env.SERVER_DATA_FILE_PATH_3,
			process.env.SERVER_DATA_FILE_PATH_4
		];

		const decryptedFiles: { [key: string]: string } = {};

		for (let [index, filePath] of filePaths.entries()) {
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

async function getSSLKeys(dependencies: SopsDependencies) {
	const { logger, execSync, getDirectoryPath } = dependencies;
	try {
		const keyPath = path.join(
			getDirectoryPath(),
			'./keys/ssl/guestbook_key.pem.gpg'
		);
		const certPath= path.join(
			getDirectoryPath(),
			'./keys/ssl/guestbook_cert.pem.gpg'
		);
		const decryptedKey = await decryptKey({ logger, execSync}, keyPath);
		const decryptedCert = await decryptKey({ logger, execSync}, certPath);

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
