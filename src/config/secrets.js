import execSync from 'child_process';
import path from 'path';
import { __dirname } from '../index.js';


async function getSecrets() {
  try {
    const secretsPath = path.join(__dirname, 'secrets.json.gpg');
    const decryptedSecrets = execSync(
      `sops -d --output-type json ${secretsPath}`,
    ).toString();
    return JSON.parse(decryptedSecrets);
  } catch (err) {
    console.error('Error retrieving secrets from SOPS: ', err);
    throw err;
  }
}

export default getSecrets;
