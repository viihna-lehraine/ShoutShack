import { execSync } from 'child_process';
import path from 'path';
import setupLogger from './logger';

const __dirname = process.cwd();
const logger = await setupLogger();

function getDirectoryPath() {
	// Return absolute path to secrets.ts
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

export default getSecrets;
