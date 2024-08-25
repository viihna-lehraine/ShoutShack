import { execSync } from 'child_process';
import path from 'path';
import setupLogger from './logger';

const logger = setupLogger();
const __dirname = process.cwd();

function getDirectoryPath() {
	return path.resolve(__dirname);
}

async function getSecrets() {
	try {
		const secretsPath = path.join(
			getDirectoryPath(),
			'../backend/config/secrets.json.gpg'
		);
		logger.info('Resolved secrets path:', secretsPath);
		const decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();
		return JSON.parse(decryptedSecrets);
	} catch (err) {
		logger.info('Error retrieving secrets from SOPS: ', err);
		throw err;
	}
}

async function decryptKey(encryptedFilePath: string) {
	try {
		let decryptedKey = execSync(
			`sops -d --output-type string ${encryptedFilePath}`
		).toString('utf-8');
		return decryptedKey;
	} catch (err) {
		logger.error('Error decrypting key from SOPS: ', err);
		throw err;
	}
}

async function decryptDataFiles() {
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
		logger.error('Error decrypting files from backend data folder: ', err);
		throw err;
	}
}
async function getSSLKeys() {
	try {
		const keyPath = path.join(
			__dirname,
			'./keys/ssl/guestbook_key.pem.gpg'
		);
		const certPath = path.join(
			__dirname,
			'./keys/ssl/guestbook_cert.pem.gpg'
		);
		const decryptedKey = await decryptKey(keyPath);
		const decryptedCert = await decryptKey(certPath);

		return {
			key: decryptedKey,
			cert: decryptedCert
		};
	} catch (err) {
		logger.error('Error retrieving SSL keys from SOPS: ', err);
		throw err;
	}
}

export default { decryptDataFiles, getSecrets, getSSLKeys };
