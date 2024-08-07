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
};

async function decryptFile(encryptedFilePath) {
    try {
        const decryptedFile = execSync(`sops -d ${encryptedFilePath}`).toString();
        return decryptedFile;
    } catch (err) {
        console.error('Error decrypting file from SOPS: ', err);
        throw err;
    }
};

async function getSSLKeys() {
    try {
        const keyPath = path.join(__dirname, '../../.keys/ssl/app.key.gpg');
        const certPath = path.join(__dirname, '../../.keys/ssl/app.crt.gpg');

        const decryptedKey = await decryptFile(keyPath);
        const decryptedCert = await decryptFile(certPath);

         // *DEV-NOTE* console.log('Decrypted Key:', decryptedKey);
         // *DEV-NOTE* console.log('Decrypted Cert:', decryptedCert);
    
        return {
            key: decryptedKey,
            cert: decryptedCert
        };
    } catch (err) {
        console.error('Error retrieving SSL keys from SOPS: ', err);
        throw err;
    }
};


module.exports = {
    getSecrets,
    getSSLKeys
};