import { execSync } from 'child_process';
import path from 'path';

function getDirectoryPath() {
	return path.resolve(process.cwd(), path.dirname(''));
}

async function getSecrets() {
	try {
		const secretsPath = path.join(getDirectoryPath(), 'secrets.json.gpg');
		const decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();
		return JSON.parse(decryptedSecrets);
	} catch (err) {
		console.error('Error retrieving secrets from SOPS: ', err);
		throw err;
	}
}

export default getSecrets;
