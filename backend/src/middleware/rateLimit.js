import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
	points: 100, // 100 requests
	duration: 60, // per 60 seconds, by IP
	keyPrefix: 'rateLimiter' // useful for distinguishing rate limiters in logs or in distributed setups
});

export const rateLimitMiddleware = (req, res, next) => {
	rateLimiter
		.consume(req.ip)
		.then(() => {
			next();
		})
		.catch(() => {
			res.status(429).send('Too many requests');
		});
};
