// File: backend/tests/unit/routes/index.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerRoutes } from '../../../src/routes/index.js';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs/promises';

const fastifyMock = {
	register: vi.fn(),
	setNotFoundHandler: vi.fn() as unknown as FastifyInstance['setNotFoundHandler']
} as unknown as FastifyInstance;

let notFoundHandler: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;

vi.mock('fs/promises', async () => {
	return {
		default: {
			readFile: vi.fn(async (filePath: string) => {
				if (filePath.includes('404.html')) {
					return '<h1>404 - Not Found</h1>';
				}
				throw new Error('File not found');
			})
		}
	};
});

describe('registerRoutes()', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		fastifyMock.setNotFoundHandler = vi.fn(
			(handler: (req: FastifyRequest, reply: FastifyReply) => Promise<void>) => {
				notFoundHandler = handler;
				return fastifyMock;
			}
		) as FastifyInstance['setNotFoundHandler'];

		registerRoutes(fastifyMock);
	});

	it('should register API routes', () => {
		expect(fastifyMock.register).toHaveBeenCalled();
		expect(fastifyMock.setNotFoundHandler).toHaveBeenCalled();
	});

	it('should serve 404.html if it exists', async () => {
		const mockReply = {
			code: vi.fn().mockReturnThis(),
			type: vi.fn().mockReturnThis(),
			send: vi.fn()
		} as unknown as FastifyReply;

		await notFoundHandler({} as FastifyRequest, mockReply);

		expect(fs.readFile).toHaveBeenCalledWith('/usr/share/nginx/html/404.html', 'utf-8');
		expect(mockReply.code).toHaveBeenCalledWith(404);
		expect(mockReply.type).toHaveBeenCalledWith('text/html');
		expect(mockReply.send).toHaveBeenCalledWith('<h1>404 - Not Found</h1>');
	});

	it('should send "404 Not Found" if 404.html is missing', async () => {
		vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));

		const mockReply = {
			code: vi.fn().mockReturnThis(),
			send: vi.fn()
		} as unknown as FastifyReply;

		await notFoundHandler({} as FastifyRequest, mockReply);

		expect(fs.readFile).toHaveBeenCalledWith('/usr/share/nginx/html/404.html', 'utf-8');
		expect(mockReply.code).toHaveBeenCalledWith(404);
		expect(mockReply.send).toHaveBeenCalledWith('404 Not Found');
	});
});
