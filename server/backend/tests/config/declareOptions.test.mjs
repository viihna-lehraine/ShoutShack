import { declareOptions } from '../../dist/config/http.mjs';
import sops from '../../dist/config/sops.mjs';
import { promises as fs } from 'fs';
import { constants } from 'crypto';

vi.mock('../../dist/config/sops');
vi.mock('fs/promises');

describe('declareOptions', () => {
	it('should retrieve SSL keys via sops.getSSLKeys() when DECRYPT_KEYS is true', async () => {
		process.env.DECRYPT_KEYS = 'true';
		const mockKeys = { key: 'mockKey', cert: 'mockCert' };
		sops.getSSLKeys.mockResolvedValue(mockKeys);

		const options = await declareOptions();

		expect(options.key).toBe(mockKeys.key);
		expect(options.cert).toBe(mockKeys.cert);
		expect(sops.getSSLKeys).toHaveBeenCalled();
	});

	it('should read SSL keys from environment variables when DECRYPT_KEYS is false', async () => {
		process.env.DECRYPT_KEYS = 'false';
		process.env.SERVER_SSL_KEY_PATH = 'mockKeyPath';
		process.env.SERVER_SSL_CERT_PATH = 'mockCertPath';

		fs.readFile
			.mockResolvedValueOnce('mockKey')
			.mockResolvedValueOnce('mockCert');

		const options = await declareOptions();

		expect(options.key).toBe('mockKey');
		expect(options.cert).toBe('mockCert');
		expect(fs.readFile).toHaveBeenCalledTimes(2);
	});

	it('should throw an error if SSL_KEY or SSL_CERT is not set when DECRYPT_KEYS is false', async () => {
		process.env.DECRYPT_KEYS = 'false';
		delete process.env.SERVER_SSL_KEY_PATH;
		delete process.env.SERVER_SSL_CERT_PATH;

		await expect(declareOptions()).rejects.toThrow(
			'SSL_KEY or SSL_CERT environment variable is not set'
		);
	});

	it('should return the correct options object', async () => {
		process.env.DECRYPT_KEYS = 'true';
		const mockKeys = { key: 'mockKey', cert: 'mockCert' };
		sops.getSSLKeys.mockResolvedValue(mockKeys);

		const options = await declareOptions();

		expect(options).toEqual({
			key: 'mockKey',
			cert: 'mockCert',
			allowHTTP1: true,
			secureOptions:
				constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
			ciphers: expect.any(String),
			honorCipherOrder: true
		});
	});
});
