import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 1000, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP address. Please try again later.',
	standardHeaders: true, // Return rate limit info in the RateLimit-* headers
	legacyHeaders: false, // Disable the 'X-RateLimit-*' headers
});

export default limiter;
