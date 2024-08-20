import { execSync } from 'child_process';
import path from 'path';
import { __dirname } from './loadEnv';
import setupLogger from '../middleware/logger';

async function decryptFile(encryptedFilePath: string) {
	const logger = await setupLogger();

	try {
		const decryptedFile = execSync(
			`sops -d --output-type json ${encryptedFilePath}`
		).toString();
		return decryptedFile;
	} catch (err) {
		logger.error('Error decrypting file from SOPS: ', err);
		throw err;
	}
}

async function decryptDataFiles() {
	const logger = await setupLogger();

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
		logger.error('Error decrypting files from backend data folder: ', err);
		throw err;
	}
}

async function getSSLKeys() {
	const logger = await setupLogger();

	try {
		const keyPath = path.join(__dirname, '../../keys/ssl/app.pem.key.gpg');
		const certPath = path.join(
			__dirname,
			'../../keys/ssl/app.cert.pem.gpg'
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
