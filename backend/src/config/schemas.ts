// File: backend/src/config/schemas.ts

import z from 'zod';

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string()
});

export const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8, 'Password must be at least 8 characters long')
});
