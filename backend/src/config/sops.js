import { execSync } from 'child_process';
import path from 'path';
import { __dirname } from './loadEnv.js';
import setupLogger from './logger.js';

async function decryptFile(encryptedFilePath) {
	const logger = await setupLogger();

	try {
		const decryptedFile = execSync(`sops -d ${encryptedFilePath}`).toString();
		return decryptedFile;
	} catch (err) {
		logger.error('Error decrypting file from SOPS: ', err);
		throw err;
	}
}

async function getSSLKeys() {
	const logger = await setupLogger();

	try {
		const keyPath = path.join(__dirname, '../../keys/ssl/app.key.gpg');
		const certPath = path.join(__dirname, '../../keys/ssl/app.crt.gpg');
		const decryptedKey = await decryptFile(keyPath);
		const decryptedCert = await decryptFile(certPath);

		// *DEV-NOTE* debugging
		// logger.info(`Decrypted SSL Key: ${decryptedKey.slice(0, 100)}...`);
		// logger.info(`Decrypted SSL Cert: ${decryptedCert.slice(0, 100)}...`);

		return {
			key: decryptedKey,
			cert: decryptedCert,
		};
	} catch (err) {
		logger.error('Error retrieving SSL keys from SOPS: ', err);
		throw err;
	}
}

export default getSSLKeys;
