// File: server/src/routes/static/main.ts

import { StaticParams } from '../../types/index.js';
import { FastifyInstance } from 'fastify';
import path from 'path';

export const registerStaticRoutes = (fastify: FastifyInstance) => {
	fastify.register(import('@fastify/static'), {
		root: '/usr/share/nginx/html',
		prefix: '/',
		decorateReply: false // prevents modification of response headers
	});

	fastify.get<{ Params: StaticParams }>('/admin/*', async (request, reply) => {
		const filePath = request.params['*'];
		return reply.sendFile(filePath, path.join('/usr/share/nginx/html/admin'));
	});

	fastify.get<{ Params: StaticParams }>('/docs/*', async (request, reply) => {
		const filePath = request.params['*'];
		return reply.sendFile(filePath, path.join('/usr/share/nginx/docs'));
	});

	fastify.get<{ Params: StaticParams }>('/public/*', async (request, reply) => {
		const filePath = request.params['*'];
		return reply.sendFile(filePath, path.join('/usr/share/nginx/public/assets'));
	});

	fastify.get<{ Params: StaticParams }>('/uploads/*', async (request, reply) => {
		const filePath = request.params['*'];
		const uploadPath = path.join('/var/www/shoutshack/uploads', filePath);

		if (process.env.ALLOW_UPLOADS !== 'true') {
			return reply.code(403).send('Uploads are disabled.');
		}

		return reply.sendFile(uploadPath);
	});
};
