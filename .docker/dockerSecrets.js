import { execSync } from 'child_process';
import path from 'path';

async function getDockerSecrets() {
	const logger = await setupLogger();

	try {
		const secretsPath = path.resolve(
			__dirname,
			'secrets.docker.json.gpg'
		);

		const decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();

		return JSON.parse(decryptedSecrets);
	} catch (err) {
		logger.error('Error retrieving Docker secrets from SOPS: ', err);
		throw err;
	}
}

export default getDockerSecrets;
