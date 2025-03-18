// File: backend/tests/unit/plugins/auth.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fastify, {
	FastifyBaseLogger,
	FastifyInstance,
	FastifyRequest,
	FastifyReply,
	RouteOptions
} from 'fastify';
import { registerAuthPlugin } from '../../../src/plugins/auth.js';
import argon2 from 'argon2';

describe('Auth Plugin', () => {
	let app: ReturnType<typeof fastify>;

	beforeEach(() => {
		app = fastify();
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	it('should register fastifyCookie and fastifySession', async () => {
		const registerSpy = vi.spyOn(app, 'register');

		registerAuthPlugin(app);

		expect(registerSpy).toHaveBeenCalledWith(expect.any(Function));
		expect(registerSpy).toHaveBeenCalledWith(
			expect.any(Function),
			expect.objectContaining({
				secret: expect.any(String),
				cookie: expect.objectContaining({
					httpOnly: true,
					secure: expect.any(Boolean),
					sameSite: 'lax',
					maxAge: expect.any(Number)
				}),
				saveUninitialized: false
			})
		);
	});

	it('should register `hashPassword` decorator', async () => {
		registerAuthPlugin(app);
		expect(app.hasDecorator('hashPassword')).toBe(true);
	});

	it('should hash a password correctly', async () => {
		registerAuthPlugin(app);
		const password = 'testpassword';
		const hashPassword = app.hashPassword as (password: string) => Promise<string>;
		const hashed = await hashPassword(password);

		expect(hashed).toBeDefined();
		expect(await argon2.verify(hashed, password + process.env.PEPPER)).toBe(true);
	});

	it('should register `authenticate` decorator', async () => {
		registerAuthPlugin(app);
		expect(app.hasDecorator('authenticate')).toBe(true);
	});

	it('should return 401 if user is not authenticated', async () => {
		registerAuthPlugin(app);

		const authenticate = app.authenticate as (
			req: FastifyRequest,
			reply: FastifyReply
		) => Promise<void>;

		const mockLogger: FastifyBaseLogger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
			trace: vi.fn(),
			fatal: vi.fn(),
			child: vi.fn(),
			level: 'info',
			silent: vi.fn()
		};

		const requestMock = {
			session: { user: undefined } as any,
			headers: {},
			query: {},
			params: {},
			body: {},
			log: mockLogger,
			id: 'test-id',
			raw: {} as FastifyRequest['raw'],
			server: {} as FastifyInstance,
			req: {} as FastifyRequest['raw'],
			ip: '127.0.0.1',
			ips: ['127.0.0.1'],
			hostname: 'localhost',
			protocol: 'http',
			method: 'GET',
			url: '/',
			originalUrl: '/',
			routeOptions: {} as RouteOptions,
			port: 3000,
			host: 'localhost',
			socket: {} as FastifyRequest['socket']
		} as FastifyRequest;
		const replyMock = {
			code: vi.fn().mockReturnThis(),
			send: vi.fn(),
			header: vi.fn().mockReturnThis(),
			getHeader: vi.fn(),
			removeHeader: vi.fn(),
			hasHeader: vi.fn(),
			redirect: vi.fn().mockReturnThis(),
			status: vi.fn().mockReturnThis(),
			type: vi.fn().mockReturnThis(),
			raw: {} as any,
			routeOptions: {} as RouteOptions,
			elapsedTime: 0,
			log: mockLogger
		} as unknown as FastifyReply;

		await authenticate(requestMock, replyMock);

		expect(replyMock.code).toHaveBeenCalledWith(401);
		expect(replyMock.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
	});

	it('should log "Authentication plugin registered"', async () => {
		const logSpy = vi.spyOn(console, 'log');

		registerAuthPlugin(app);

		expect(logSpy).toHaveBeenCalledWith('Authentication plugin registered');
	});
});
