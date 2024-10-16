import vault from 'node-vault';

const vaultClient = vault({
	apiVersion: 'v1',
	endpoint: '', // SECRETS.JSON.GPG > VAULT_ADDR,
	token: '' // SECRETS.JSON.GPG > VAULT_TOKEN || SECRETS.JSON.GPG > FALLBACK_VAULT_TOKEN,
});

export async function getSecret(path: string): Promise<string> {
	try {
		const result = await vaultClient.read(path);
		console.log('Secret data:', result.data);
	} catch (err) {
		console.error('Error fetching secret:', err);
	}
}

getSecret();
