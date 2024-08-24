import { execSync } from 'child_process';
import path from 'path';
import { __dirname } from './loadEnv';
import setupLogger from './logger';

const logger = await setupLogger();

async function decryptFile(encryptedFilePath: string) {
	try {
		let decryptedFile = execSync(
			`sops -d --output-type json ${encryptedFilePath}`
		).toString();
		return decryptedFile;
	} catch (err) {
		logger.error('Error decrypting file from SOPS: ', err);
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
		const decryptedKey = await decryptFile(keyPath);
		const decryptedCert = await decryptFile(certPath);

		return {
			key: decryptedKey,
			cert: decryptedCert
		};
	} catch (err) {
		logger.error('Error retrieving SSL keys from SOPS: ', err);
		throw err;
	}
}

export default { decryptDataFiles, getSSLKeys };
