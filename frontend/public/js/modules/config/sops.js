import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function decryptSecrets() {
    try {
        const encryptedFilePath = path.join(__dirname, '../config/secrets.json.gpg');
        const decryptedSecrets = execSync(`sops -d ${encryptedFilePath}`).toString();
        return JSON.parse(decryptedSecrets);
    } catch (err) {
        console.error('Error decrypting secrets from SOPS: ', err);
        throw err;
    }
};
