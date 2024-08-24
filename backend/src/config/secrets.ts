import { execSync } from 'child_process';
import path from 'path';

let __dirname = process.cwd();

function getDirectoryPath() {
	// Return the absolute path to the directory containing secrets.js
	return path.resolve(__dirname);
}

async function getSecrets() {
	try {
		let secretsPath = path.join(
			getDirectoryPath(),
			'../backend/config/secrets.json.gpg'
		);
		console.log('Resolved secrets path:', secretsPath); // debugging line to verify the correct path
		let decryptedSecrets = execSync(
			`sops -d --output-type json ${secretsPath}`
		).toString();
		return JSON.parse(decryptedSecrets);
	} catch (err) {
		console.error('Error retrieving secrets from SOPS: ', err);
		throw err;
	}
}

export default getSecrets;
