import assert from 'assert';
import request from 'supertest';
import app from '../src/server.js';

describe('CSP Nonce Tests', () => {
	it('should set CSP Nonce and return a success message', async () => {
		const response = await request(app).get('/test').expect(200);

		assert.match(response.text, /CSP Nonce is valid and set/);
	});

	it('should return 500 if CSP Nonce is not set', async () => {
		const response = await request(app).get('/testWithoutNonce').expect(500);

		assert.match(response.text, /CSP Nonce validation failed/);
	});
});
