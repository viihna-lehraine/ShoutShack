import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secretsPath = path.join(__dirname, '../../../config/secrets.json.gpg');

export async function decryptSecrets() {
	try {
		// decrypt secrets using SOPS and GPG key
		const decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();
		// parse the decrypted JSON
		const secrets = JSON.parse(decryptedSecrets);
		// return the secrets
		return secrets;
	} catch (err) {
		console.error('Error decrypting secrets: ', err);
		throw err;
	}
}

export default decryptSecrets;
