import { constants } from 'crypto';
import fs from 'fs';
import http2 from 'http2';
import https from 'https';
import featureFlags from './featureFlags.js';
import setupLogger from './logger.js';
import app from '../server.js';

async function startHttp1Server() {
    const logger = await setupLogger();
    const keyPath = process.env.SERVER_SSL_KEY_PATH;
    const certPath = process.env.SERVER_SSL_CERT_PATH;

    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
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
            'ECDHE-RSA-AES128-SHA256',
        ].join(':'),
        honorCipherOrder: true,
    };

	https.createServer(options, app).listen(process.env.SERVER_PORT, () => {
		logger.info(`Server running on port ${process.env.SERVER_PORT}`);
	});
}

async function startHttp2Server() {
    const logger = await setupLogger();
    const keyPath = process.env.SERVER_SSL_KEY_PATH;
    const certPath = process.env.SERVER_SSL_CERT_PATH;

    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
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
            'ECDHE-RSA-AES128-SHA256',
        ].join(':'),
        honorCipherOrder: true,
    };

	http2
		.createSecureServer(options, app)
		.listen(process.env.SERVER_PORT, () => {
		    logger.info(`Server running on port ${process.env.SERVER_PORT}`);
		});
}

async function startServer() {
    const logger = await setupLogger();

    if (featureFlags.http2Flag && !featureFlags.http1Flag) {
        logger.info('Starting server with HTTP/2');
        await startHttp2Server();
    } else if (featureFlags.http1Flag && !featureFlags.http2Flag) {
        logger.info('Starting server with HTTP/1.1');
        await startHttp1Server();
    } else {
        logger.error('HTTP1 / HTTP2 flags not correctly set. Please check backend .env file');
        throw new Error('HTTP1 / HTTP2 flags not correctly set. Please check backend .env file');
    }
}

export default startServer;