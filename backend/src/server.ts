import Fastify from 'fastify';
import routes from './routes';

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
        await fastify.listen({ port: 3000 });
        console.log('Server running at http://localhost:3000');
    } catch (err) {
        console.error('Failed to start the server:', err);
        fastify.log.error(err);
        process.exit(1);
    }
};


start();
