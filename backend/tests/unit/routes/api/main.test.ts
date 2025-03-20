// File: backend/tests/unit/routes/api/main.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerApiRoutes } from '../../../../src/routes/api/main.js';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AuthController } from '../../../../src/controllers/AuthController.js';

const fastifyMock = {
	register: vi.fn(),
	get: vi.fn(),
	post: vi.fn(),
	hasDecorator: vi.fn()
} as unknown as FastifyInstance;

vi
	.spyOn(AuthController, 'signup')
	.mockImplementation(async (_req: FastifyRequest, reply: FastifyReply) => {
		reply.send({ message: 'Signup successful' });
		return undefined as never; // 🚨 FORCE TYPE
	}) as unknown as typeof AuthController.signup;

vi
	.spyOn(AuthController, 'login')
	.mockImplementation(async (_req: FastifyRequest, reply: FastifyReply) => {
		reply.send({ message: 'Login successful' });
		return undefined as never;
	}) as unknown as typeof AuthController.login;

vi
	.spyOn(AuthController, 'verify')
	.mockImplementation(async (_req: FastifyRequest, reply: FastifyReply) => {
		reply.send({ message: 'Verification complete' });
		return undefined as never;
	}) as unknown as typeof AuthController.verify;

vi
	.spyOn(AuthController, 'getProfile')
	.mockImplementation(async (_req: FastifyRequest, reply: FastifyReply) => {
		reply.send({ user: { id: 1, email: 'test@example.com' } });
		return undefined as never;
	}) as unknown as typeof AuthController.getProfile;

describe('registerApiRoutes()', async () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should register API routes with the correct prefix', () => {
		registerApiRoutes(fastifyMock);
		expect(fastifyMock.register).toHaveBeenCalledWith(expect.any(Function), { prefix: '/api' });
	});

	it('should register health check, signup, login, and verify routes', async () => {
		registerApiRoutes(fastifyMock);

		const registerFn = (fastifyMock.register as unknown as ReturnType<typeof vi.fn>).mock
			.calls[0][0];
		await registerFn(fastifyMock);

		expect(fastifyMock.get).toHaveBeenCalledWith('/health', expect.any(Function));
		expect(fastifyMock.post).toHaveBeenCalledWith('/signup', AuthController.signup);
		expect(fastifyMock.post).toHaveBeenCalledWith('/login', AuthController.login);
		expect(fastifyMock.get).toHaveBeenCalledWith('/verify', AuthController.verify);
	});

	it('should register /profile route with authentication if available', () => {
		fastifyMock.hasDecorator = vi.fn(() => true);
		registerApiRoutes(fastifyMock);

		expect(fastifyMock.get).toHaveBeenCalledWith(
			'/profile',
			{ preHandler: expect.any(Function) },
			AuthController.getProfile
		);
	});

	it('should register /profile route with authentication if available', async () => {
		fastifyMock.hasDecorator = vi.fn(() => true);
		registerApiRoutes(fastifyMock);

		const registerFn = (fastifyMock.register as unknown as ReturnType<typeof vi.fn>).mock
			.calls[0][0];
		await registerFn(fastifyMock);

		expect(fastifyMock.get).toHaveBeenCalledWith(
			'/profile',
			{ preHandler: expect.any(Function) },
			AuthController.getProfile
		);
	});
});
