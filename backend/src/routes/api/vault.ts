// File: backend/src/api/vault.ts

import axios from 'axios';
import fs from 'fs';

const VAULT_ADDR = process.env.VAULT_ADDR || 'https://shoutshack-vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'shoutshack-root'; // TODO: Replace with dynamic authentication

const httpsAgent = new (require('https').Agent)({
	rejectUnauthorized: true,
	ca: fs.readFileSync('/app/tls/ca.crt').toString(),
	cert: fs.readFileSync('/app/tls/backend.crt').toString(),
	key: fs.readFileSync('/app/tls/backend.key').toString()
});

const vaultClient = axios.create({
	baseURL: `${VAULT_ADDR}/v1`,
	headers: { 'X-Vault-Token': VAULT_TOKEN },
	httpsAgent
});

export async function getSecret(secretPath: string) {
	try {
		const response = await vaultClient.get(`/secret/data/${secretPath}`);
		return response.data?.data?.data;
	} catch (err) {
		console.error('Failed to fetch secret from Vault', err);
		throw err;
	}
}
