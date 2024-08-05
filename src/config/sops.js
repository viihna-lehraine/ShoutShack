const { execSync } = require('child_process');
const path = require('path');


async function getSecrets() {
    try {
        const secretsPath = path.join(__dirname, 'secrets.json.gpg');
        const decryptedFile = execSync(`sops -d ${secretsPath}`).toString();
        return JSON.parse(decryptedFile);
    } catch (err) {
        console.error('Error retrieving secrets from SOPS: ', err);
        throw err;
    }
};


module.exports = getSecrets