import express, { Application } from 'express';
import { constants } from 'crypto';
import http2 from 'http2';
import createHttp2ExpressBridge from 'http2-express-bridge';
import https from 'https';
import featureFlags from './featureFlags';
import setupLogger from '../middleware/logger';
import sops from './sops';

export async function setupHttp(app: Application) {
	console.log('setupHttp() executing');
	let logger = await setupLogger();
	let sslKeys = await sops.getSSLKeys();

	// Define global SSL options
	let options = {
		key: sslKeys.key,
		cert: sslKeys.cert,
		allowHTTP1: true,
		secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
		ciphers: [
			'ECDHE-ECDSA-AES256-GCM-SHA384',
			'ECDHE-RSA-AES256-GCM-SHA384',
			'ECDHE-ECDSA-CHACHA20-POLY1305',
			'ECDHE-RSA-CHACHA20-POLY1305',
			'ECDHE-ECDSA-AES128-GCM-SHA256',
			'ECDHE-RSA-AES128-GCM-SHA256',
			'ECDHE-ECDSA-AES256-SHA384',
			'ECDHE-RSA-AES256-SHA384',
			'ECDHE-ECDSA-AES128-SHA256',
			'ECDHE-RSA-AES128-SHA256'
		].join(':'),
		honorCipherOrder: true
	};

	async function startHttp1Server() {
		logger.info('Starting HTTP1.1 server');
		logger.info('Server port: ', process.env.SERVER_PORT);

		https.createServer(options, app).listen(process.env.SERVER_PORT, () => {
			logger.info(
				`HTTP1.1 server running on port ${process.env.SERVER_PORT}`
			);
		});
	}

	async function startHttp2Server() {
		let http2App = createHttp2ExpressBridge(express);

		// Use the existing Express app as middleware for the HTTP2-compatible app
		http2App.use(app);

		try {
			http2
				.createSecureServer(options, http2App)
				.listen(process.env.SERVER_PORT, () => {
					logger.info(
						`HTTP2 server running on port ${process.env.SERVER_PORT}`
					);
				});
		} catch (err) {
			logger.error('Error starting HTTP2 server: ', err);
			throw err;
		}
	}

	async function startServer() {
		if (featureFlags.http1Flag) {
			await startHttp1Server();
		} else if (featureFlags.http2Flag) {
			await startHttp2Server();
		} else {
			logger.error(
				'Please set one of the HTTP flags to true in the .env file'
			);
			throw new Error(
				'Please set one of the HTTP flags to true in the .env file'
			);
		}
	}

	return { startServer };
}
