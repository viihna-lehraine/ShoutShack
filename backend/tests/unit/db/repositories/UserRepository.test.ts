// File: backend/tests/unit/db/repositories/UserRepository.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from '../../../../src/db/repositories/UserRepository.js';
import { db } from '../../../../src/db/main.js';

vi.mock('../../../../src/db/main.js', () => {
	const insertMock = {
		values: vi.fn().mockReturnThis(),
		returning: vi.fn().mockReturnThis(),
		executeTakeFirstOrThrow: vi.fn(async () => ({ id: 1 }))
	};

	const selectMock = {
		select: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		executeTakeFirst: vi.fn()
	};

	const updateMock = {
		set: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		returning: vi.fn().mockReturnThis(),
		executeTakeFirst: vi.fn()
	};

	return {
		db: {
			insertInto: vi.fn(() => insertMock),
			selectFrom: vi.fn(() => selectMock),
			updateTable: vi.fn(() => updateMock)
		}
	};
});

describe('UserRepository', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createUser()', () => {
		it('should insert a new user and return a verification token', async () => {
			const token = await UserRepository.createUser('test@example.com', 'hashed_password');

			expect(db.insertInto).toHaveBeenCalledWith('users');
			expect(db.insertInto('users').values).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'test@example.com',
					password: 'hashed_password',
					verified: false
				})
			);
			expect(db.insertInto('users').returning).toHaveBeenCalledWith(['id']);
			expect(db.insertInto('users').executeTakeFirstOrThrow).toHaveBeenCalled();
			expect(token).toBeDefined();
		});
	});

	describe('findUserByEmail()', () => {
		it('should return user details if email exists', async () => {
			const mockUser = { id: 1, email: 'test@example.com', password: 'hashed_password' };

			// TODO: fix this type casting
			(db.selectFrom('users')!.executeTakeFirst as any).mockResolvedValue(mockUser);

			const user = await UserRepository.findUserByEmail('test@example.com');

			expect(db.selectFrom).toHaveBeenCalledWith('users');
			expect(db.selectFrom('users').select).toHaveBeenCalledWith(['id', 'email', 'password']);
			expect(db.selectFrom('users').where).toHaveBeenCalledWith(
				'email',
				'=',
				'test@example.com'
			);
			expect(user).toEqual(mockUser);
		});
	});
});
