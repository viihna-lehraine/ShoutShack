import { execSync } from 'child_process';
import path from 'path';

// Set up __dirname and __filename for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
};

export default { getSecrets };