import { HelmetOptions } from "helmet";

export const contentSecurityPolicyOptions = {
	directives: {
		connectSrc: [
			"'self'",
			'https://api.haveibeenpwned.com',
			'https://cdnjs.cloudflare.com',
		],
		defaultSrc: ["'self'"],
		fontSrc: ["'self'"],
		frameAncestors: ["'none'"],
		imgSrc: ["'self'", 'data:'],
		objectSrc: ["'none'"],
		scriptSrc: ["'self'", 'https://api.haveibeenpwned.com'],
		styleSrc: ["'self'", "'unsafe-inline'"], // *DEV-NOTE* switch to nonce-based inline style usage
		upgradeInsecureRequests: [],
	},
	reportOnly: false // set to true to test policy without blocking
}

export const helmetOptions: HelmetOptions = {
	frameguard: { action: 'deny' },
	dnsPrefetchControl: { allow: false },
	hidePoweredBy: true,
	hsts: {
		maxAge: 31536000, // 1 year
		includeSubDomains: true,
		preload: true, // enable HSTS preload list
	},
	ieNoOpen: true,
	noSniff: true
};

export const permissionsPolicyOptions = {
	accelerometer: ["'none'"],
	ambientLightSensor: ["'none'"],
	autoplay: ["'self'"],
	camera: ["'none'"],
	documentDomain: ["'none'"],
	documentWrite: ["'none'"],
	fonts: ["'none'"],
	fullscreen: ["'none'"],
	geolocation: ["'none'"],
	gyroscope: ["'none'"],
	magnetometer: ["'none'"],
	microphone: ["'none'"],
	midi: ["'none'"],
	modals: ["'none'"],
	notifications: ["'self'"],
	payment: ["'none'"],
	push: ["'none'"],
	syncXhr: ["'none'"],
	vr: ["'none'"],
};
