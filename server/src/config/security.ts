// File: server/src/config/security.ts

import { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCompress from '@fastify/compress';

export const registerSecurityMiddleware = (app: FastifyInstance) => {
	// 1. CORS
	app.register(fastifyCors, {
		origin: ['https://shoutshack.example.com', 'http://localhost:5173'],
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization']
	});

	// 2. Helmet
	app.register(helmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
				styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
				imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
				fontSrc: ["'self'", 'fonts.gstatic.com'],
				connectSrc: ["'self'"],
				objectSrc: ["'none'"],
				upgradeInsecureRequests: []
			}
		},
		dnsPrefetchControl: { allow: false },
		frameguard: { action: 'deny' }, // anti-clickjacking
		hidePoweredBy: true,
		// TODO: turn this on when HTTPS works
		// hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // enforce HTTPS
		permittedCrossDomainPolicies: { permittedPolicies: 'none' },
		referrerPolicy: { policy: 'no-referrer' },
		xssFilter: true
	});

	// 3. Rate Limiting
	app.register(fastifyRateLimit, {
		max: 100, // 100 requests
		timeWindow: '1 minute',
		errorResponseBuilder: (_req, context) => {
			return {
				statusCode: 429,
				error: 'Too Many Requests',
				message: `Calm down! Try again in ${context.ttl / 1000} seconds.`
			};
		}
	});

	// 4. Compression
	app.register(fastifyCompress, {
		customTypes: /^text\/|\+json$|\+xml$/,
		global: true,
		encodings: ['gzip', 'deflate', 'br'],
		threshold: 1024
	});

	console.log('Security middleware registered');
};
