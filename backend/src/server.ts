import Fastify from 'fastify';
import './config/loadEnv';
import routes from './routes/routes';

const fastify = Fastify({
    logger: {
        level: 'debug',
        transport: {
            target: 'pino-pretty',
            options: {
                destination: '../logs/fastify.log'
            }
        }
    }
});

if (!process.env.SERVER_PORT || isNaN(parseInt(process.env.SERVER_PORT, 10))) {
	console.error('SERVER_PORT is malformed or undefined. Check .env file.');
	process.exit(1);
}

const SERVER_PORT = parseInt(process.env.SERVER_PORT, 10) || 3050;

fastify.addHook('onClose', (instance, done) => {
	console.log('Fastify is shutting down...');
	done();
})

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Graceful shutdown...');
    fastify.close().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    fastify.close().then(() => process.exit(0));
});

routes(fastify);

const start = async () => {
    try {
        await fastify.listen({ port: SERVER_PORT });
        console.log(`Server running at http://localhost:${SERVER_PORT}}`);
    } catch (err) {
        console.error('Failed to start the server:', err);
        fastify.log.error(err);
        process.exit(1);
    }
};


start();
