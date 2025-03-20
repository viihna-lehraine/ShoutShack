// File: backend/tests/unit/controllers/AuthController.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../../../src/controllers/AuthController.js';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRepository } from '../../../src/db/repositories/UserRepository';
import { sendVerificationEmail } from '../../../src/common/services/mailer';
import * as argon2 from 'argon2';

vi.mock('../../../src/db/repositories/UserRepository', () => ({
	UserRepository: {
		findUserByEmail:
			vi.fn<
				(
					email: string
				) => Promise<{ id: number; email: string; password: string } | undefined>
			>(),
		createUser: vi.fn<(email: string, hashedPassword: string) => Promise<string>>(),
		verifyUser: vi.fn<(token: string) => Promise<{ id: number } | null>>(),
		getUserProfile: vi.fn<(userId: number) => Promise<{ id: number; email: string } | null>>()
	}
}));

vi.mock('../../../src/services/mailer', () => ({
	sendVerificationEmail: vi.fn<(email: string, token: string) => Promise<void>>()
}));

vi.mock('argon2', async importOriginal => {
	const actual = (await importOriginal()) as typeof argon2;
	return {
		...actual,
		hash: vi.fn(() => Promise.resolve('$argon2id$v=19$m=4096,t=3,p=1$hash$')),
		verify: vi.fn(() => Promise.resolve(true))
	};
});

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('AuthController', () => {
	const mockReply = {
		status: vi.fn().mockReturnThis(),
		send: vi.fn()
	} as unknown as FastifyReply;

	const mockSession = {
		set: vi.fn(),
		get: vi.fn(() => null),
		destroy: vi.fn()
	};

	describe('signup()', () => {
		it('should create a user and send verification email', async () => {
			const mockRequest = {
				body: { email: 'test@example.com', password: 'ValidPass123' },
				query: {}
			} as unknown as FastifyRequest;

			(UserRepository.findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
			(UserRepository.createUser as ReturnType<typeof vi.fn>).mockResolvedValue(
				'verification_token'
			);
			(sendVerificationEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

			await AuthController.signup(mockRequest, mockReply);

			expect(UserRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
			expect(UserRepository.createUser).toHaveBeenCalled();
			expect(sendVerificationEmail).toHaveBeenCalledWith(
				'test@example.com',
				'verification_token'
			);
			expect(mockReply.send).toHaveBeenCalledWith({
				message: 'User registered! Check your email for verification.'
			});
		});
	});

	describe('verify()', () => {
		it('should verify a user given a valid token', async () => {
			const mockRequest = { query: { token: 'valid_token' } } as unknown as FastifyRequest;
			(UserRepository.verifyUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

			await AuthController.verify(mockRequest, mockReply);

			expect(UserRepository.verifyUser).toHaveBeenCalledWith('valid_token');
			expect(mockReply.send).toHaveBeenCalledWith({
				message: 'Email verified successfully! You can now log in.'
			});
		});

		it('should return 400 for missing token', async () => {
			const mockRequest = { query: {} } as unknown as FastifyRequest;

			await AuthController.verify(mockRequest, mockReply);

			expect(mockReply.status).toHaveBeenCalledWith(400);
			expect(mockReply.send).toHaveBeenCalledWith({ error: 'Missing verification token' });
		});
	});

	describe('login()', () => {
		it('should log in a valid user', async () => {
			const mockRequest = {
				body: { email: 'test@example.com', password: 'ValidPass123' },
				session: mockSession
			} as unknown as FastifyRequest;

			(UserRepository.findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
				id: 1,
				email: 'test@example.com',
				password: 'hashed_password'
			});

			await AuthController.login(mockRequest, mockReply);

			expect(UserRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
			expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'ValidPass123');
			expect(mockSession.set).toHaveBeenCalledWith('userId', 1);
			expect(mockReply.send).toHaveBeenCalledWith({ message: 'Login successful' });
		});
	});

	describe('logout()', () => {
		it('should destroy session and log out user', async () => {
			const mockRequest = { session: mockSession } as unknown as FastifyRequest;

			await AuthController.logout(mockRequest, mockReply);

			expect(mockSession.destroy).toHaveBeenCalled();
			expect(mockReply.send).toHaveBeenCalledWith({ message: 'Logged out successfully' });
		});
	});
});
