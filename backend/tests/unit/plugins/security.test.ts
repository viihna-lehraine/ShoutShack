// File: backend/tests/unit/plugins/security.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerSecurityPlugin } from '../../../src/plugins/security.js';
import fastify from 'fastify';

describe('Security Plugin', () => {
	let app: ReturnType<typeof fastify>;

	beforeEach(() => {
		app = fastify();
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	it('should register CORS with the correct options', async () => {
		const registerSpy = vi.spyOn(app, 'register');

		registerSecurityPlugin(app);

		expect(registerSpy).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				origin: ['https://shoutshack.example.com', 'http://localhost:5173'],
				methods: ['GET', 'POST', 'PUT', 'DELETE'],
				allowedHeaders: ['Content-Type', 'Authorization']
			})
		);
	});

	it('should register Helmet with security directives', async () => {
		const registerSpy = vi.spyOn(app, 'register');

		registerSecurityPlugin(app);

		expect(registerSpy).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				contentSecurityPolicy: expect.objectContaining({
					directives: expect.objectContaining({
						defaultSrc: ["'self'"],
						scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
						styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
						imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
						fontSrc: ["'self'", 'fonts.gstatic.com'],
						connectSrc: ["'self'"],
						objectSrc: ["'none'"],
						upgradeInsecureRequests: []
					})
				}),
				dnsPrefetchControl: { allow: false },
				frameguard: { action: 'deny' },
				hidePoweredBy: true,
				permittedCrossDomainPolicies: { permittedPolicies: 'none' },
				referrerPolicy: { policy: 'no-referrer' }
			})
		);
	});

	it('should register rate limiting with correct settings', async () => {
		const registerSpy = vi.spyOn(app, 'register');

		registerSecurityPlugin(app);

		expect(registerSpy).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				max: 100,
				timeWindow: '1 minute',
				errorResponseBuilder: expect.any(Function)
			})
		);
	});

	it('should register compression with correct encodings', async () => {
		const registerSpy = vi.spyOn(app, 'register');

		registerSecurityPlugin(app);

		expect(registerSpy).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				customTypes: /^text\/|\+json$|\+xml$/,
				global: true,
				encodings: ['gzip', 'deflate', 'br'],
				threshold: 1024
			})
		);
	});

	it('should log "Security middleware registered"', async () => {
		const logSpy = vi.spyOn(console, 'log');

		registerSecurityPlugin(app);

		expect(logSpy).toHaveBeenCalledWith('Security middleware registered');
	});
});
