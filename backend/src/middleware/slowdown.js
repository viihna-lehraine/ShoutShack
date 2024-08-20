function slowdownMiddleware(req, res, next) {
	const requestTime = new Date().getTime();

	// Check if we already stored a request time for this IP
	if (!req.session.lastRequestTime) {
		req.session.lastRequestTime = requestTime;
		next();
	} else {
		const timeDiff = requestTime - req.session.lastRequestTime;
		const slowdownThreshold = 100; // Adjust this value as needed (in ms)

		if (timeDiff < slowdownThreshold) {
			const waitTime = slowdownThreshold - timeDiff;
			setTimeout(next, waitTime);
		} else {
			req.session.lastRequestTime = requestTime;
			next();
		}
	}
}

export default slowdownMiddleware;
