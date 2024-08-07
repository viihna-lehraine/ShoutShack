// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const { execSync } = require('child_process');
const path = require('path');


async function getSecrets() {
    try {
        const secretsPath = path.join(__dirname, 'secrets.json.gpg');
        const decryptedSecrets = execSync(`sops -d --output-type json ${secretsPath}`).toString();
        return JSON.parse(decryptedSecrets);
    } catch (err) {
        console.error('Error retrieving secrets from SOPS: ', err);
        throw err;
    }
}


module.exports = { getSecrets };