import path from 'path';
import { fileURLToPath } from 'url';
import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function routes(fastify: FastifyInstance) {
	fastify.register(fastifyStatic, {
		root: path.join(__dirname, '../../public'),
		prefix: '/'
	});

	fastify.get('/', async (request, reply) => {
		console.log('Serving: ', path.join(__dirname, '../../public/html/about.html'));
		return reply.sendFile('html/index.html');
	});

	fastify.get('/about', async (request, reply) => {
		return reply.sendFile('html/about.html');
	});

	fastify.get('/confirm', async (request, reply) => {
		return reply.sendFile('html/confirm.html');
	});

	fastify.get('/contact', async (request, reply) => {
		return reply.sendFile('html/contact.html');
	});

	fastify.get('/cookie-policy', async (request, reply) => {
		return reply.sendFile('html/cookie-policy.html');
	});

	fastify.get('/dashboard', async (request, reply) => {
		return reply.sendFile('html/dashboard.html');
	});

	fastify.get('/faq', async (request, reply) => {
		return reply.sendFile('html/faq.html');
	});

	fastify.get('/feature-request', async (request, reply) => {
		return reply.sendFile('html/feature-request.html');
	});

	fastify.get('/feedback', async (request, reply) => {
		return reply.sendFile('html/feedback.html');
	});

	fastify.get('/help', async (request, reply) => {
		return reply.sendFile('html/help.html');
	});

	fastify.get('/login', async (request, reply) => {
		return reply.sendFile('html/login.html');
	});

	fastify.get('/password-reset', async (request, reply) => {
		return reply.sendFile('html/password-reset.html');
	});

	fastify.get('/privacy-policy', async (request, reply) => {
		return reply.sendFile('html/privacy-policy.html');
	});

	fastify.get('/register', async (request, reply) => {
		return reply.sendFile('html/register.html');
	});

	fastify.get('/resources', async (request, reply) => {
		return reply.sendFile('html/resources.html');
	});

	fastify.get('/security-acknowledgement', async (request, reply) => {
		return reply.sendFile('html/security-acknowledgement.html');
	});

	fastify.get('/security-policy', async (request, reply) => {
		return reply.sendFile('html/security-policy.html');
	});

	fastify.get('/sitemap', async (request, reply) => {
		return reply.sendFile('html/sitemap.html');
	});

	fastify.get('/terms-of-service', async (request, reply) => {
		return reply.sendFile('html/terms-of-service.html');
	});

	fastify.get('/tour', async (request, reply) => {
		return reply.sendFile('html/tour.html');
	});

	fastify.setNotFoundHandler((request, reply) => {
		reply.status(404).sendFile('html/not-found.html');
	});
}
