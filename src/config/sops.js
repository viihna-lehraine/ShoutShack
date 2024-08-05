// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@voidfucker.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const { execSync } = require('child_process');
const path = require('path');


async function getSecrets() {
    try {
        const secretsPath = path.join(__dirname, 'secrets.json.gpg');
        const decryptedFile = execSync(`sops -d --output-type json ${secretsPath}`).toString();
        console.log('Decrypted secrets: ', decryptedFile);
        return JSON.parse(decryptedFile);
    } catch (err) {
        console.error('Error retrieving secrets from SOPS: ', err);
        throw err;
    }
};


module.exports = getSecrets