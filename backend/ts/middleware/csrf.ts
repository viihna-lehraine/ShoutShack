import csrf from 'csrf';
import { Request, Response, NextFunction } from 'express';

// Create a new CSRF protection instance
const csrfProtection = new csrf({ secretLength: 32 });

// Middleware to add CSRF token to the respone and validate incoming CSRF tokens
export function csrfMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		// Generate and set a CSRFm token in the response locals
		res.locals.csrfToken = csrfProtection.create(req.sessionID || ''); // Generate CSRF token based on session ID or some unique identifier

		// If the request method is not GET, validate the CSRF token
		if (req.method !== 'GET') {
			const token =
				req.body.csrfToken || (req.headers['x-xsrf-token'] as string);
			if (!token || !csrfProtection.verify(req.sessionID || '', token)) {
				return res.status(403).send('Invalid CSRF token');
			}
		}

		next(); // if validation passes, proceed to the next middleware
	} catch (err) {
		next(err); // pass any errors to the error handling middleware
	}

	return;
}
