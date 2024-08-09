import express from 'express';
import request from 'supertest';
import http2 from 'http2';
import fs from 'fs';
import path from 'path';
import { constants } from 'crypto';
import { ipBlacklistMiddleware } from '../src/index.js';
import csrf from 'csrf';

const app = express();
const csrfProtection = new csrf({ secretLength: 32 });

// Testing setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(ipBlacklistMiddleware);
app.use((req, res, next) => {
	const token = req.body.csrfToken || req.headers['x-xsrf-token'];
	if (csrfProtection.verify(req.csrfToken, token)) {
		next();
	} else {
		res.status(403).send('Invalid CSRF token');
	}
});

// Sample route
app.get('/test', (req, res) => {
	res.status(200).send('Hello, World!');
});

app.post('/api/protected', (req, res) => {
	res.status(200).send('Protected API endpoint');
});

// Create a secure HTTP2 server
const sslOptions = {
	key: fs.readFileSync(path.join(__dirname, 'path-to-ssl-key.pem')),
	cert: fs.readFileSync(path.join(__dirname, 'path-to-ssl-cert.pem')),
	secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
};

const server = http2.createSecureServer(sslOptions, app);

describe('Express Server Tests', () => {
	let testServer;

	beforeAll((done) => {
		testServer = server.listen(3001, done);
	});

	afterAll((done) => {
		testServer.close(done);
	});

	it('should return a greeting on /test', async () => {
		const response = await request(app).get('/test');
		expect(response.status).toBe(200);
		expect(response.text).toBe('Hello, World!');
	});

	it('should block access to a blacklisted IP', async () => {
		// Add a sample IP to the blacklist (mock the behavior here)
		await request(app)
			.get('/api/protected')
			.set('X-Forwarded-For', '192.168.1.1')
			.expect(403);
	});

	it('should return 403 for invalid CSRF token', async () => {
		const response = await request(app)
			.post('/api/protected')
			.send({ csrfToken: 'invalid-token' });
		expect(response.status).toBe(403);
		expect(response.text).toBe('Invalid CSRF token');
	});

	it('should allow access with a valid CSRF token', async () => {
		const validToken = csrfProtection.create('my-secret');
		const response = await request(app)
			.post('/api/protected')
			.send({ csrfToken: validToken });
		expect(response.status).toBe(200);
		expect(response.text).toBe('Protected API endpoint');
	});
});
