// File: server/src/routes/index.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { registerApiRoutes } from './api/main.js';

export const registerRoutes = (fastify: FastifyInstance) => {
	console.debug('Registering routes');

	console.debug('Calling registerApiRoutes');
	registerApiRoutes(fastify);

	fastify.setNotFoundHandler(async (_request: FastifyRequest, reply: FastifyReply) => {
		try {
			const filePath = path.join('/usr/share/nginx/html', '404.html');
			const content = await fs.readFile(filePath, 'utf-8');

			reply.code(404).type('text/html').send(content);
		} catch (err) {
			reply.code(404).send('404 Not Found');
		}
	});
};
