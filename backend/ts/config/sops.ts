import { execSync } from 'child_process';
import path from 'path';
import { __dirname } from './loadEnv';
import setupLogger from '../middleware/logger';

async function decryptFile(encryptedFilePath: string) {
	let logger = await setupLogger();

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
	let logger = await setupLogger();

	try {
		let filePaths = [
			process.env.SERVER_DATA_FILE_PATH_1,
			process.env.SERVER_DATA_FILE_PATH_2,
			process.env.SERVER_DATA_FILE_PATH_3,
			process.env.SERVER_DATA_FILE_PATH_4
		];

		let decryptedFiles: { [key: string]: string } = {};

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
	let logger = await setupLogger();

	try {
		let keyPath = path.join(__dirname, '../../keys/ssl/app.pem.key.gpg');
		let certPath = path.join(__dirname, '../../keys/ssl/app.cert.pem.gpg');
		let decryptedKey = await decryptFile(keyPath);
		let decryptedCert = await decryptFile(certPath);

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
