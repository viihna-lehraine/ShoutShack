const staticCSSRouteTable = {
	'css/main.css': { GET: 'staticRouter' },
	'css/main.css.map': { GET: 'staticRouter' }
};

const staticHTMLRouteTable = {
	'/about.html': { GET: 'staticRouter' },
	'/confirm.html': { GET: 'staticRouter' },
	'/contact.html': { GET: 'staticRouter' },
	'/cookie-policy.html': { GET: 'staticRouter' },
	'/dashboard.html': { GET: 'staticRouter' },
	'/faq.html': { GET: 'staticRouter' },
	'/feature-request.html': { GET: 'staticRouter' },
	'/feedback.html': { GET: 'staticRouter' },
	'/help.html': { GET: 'staticRouter' },
	'/index.html': { GET: 'staticRouter' },
	'/generate-email-mfa': { GET: 'staticRouter' },
	'/generate-totp': { GET: 'staticRouter' },
	'/login.html': { GET: 'staticRouter' },
	'/not-found.html': { GET: 'staticRouter	' },
	'/password-reset.html': { GET: 'staticRouter' },
	'/privacy-policy.html': { GET: 'staticRouter' },
	'/recover-password.html': { GET: 'staticRouter' },
	'/register.html': { GET: 'staticRouter' },
	'/resources.html': { GET: 'staticRouter' },
	'/security-acknowledgements.html': { GET: 'staticRouter' },
	'/security-policy.html': { GET: 'staticRouter' },
	'/sitemap.html': { GET: 'staticRouter' },
	'/tos.html': { GET: 'staticRouter' },
	'/tour.html': { GET: 'staticRouter' },
	'/verify-email-mfa': { GET: 'staticRouter' },
	'/verify-totp': { GET: 'staticRouter' }
};

const staticJSRouteTable = {
	'/assets/scripts/loadZxcvbn.js': { GET: 'staticRouter' },
	'/assets/scripts/pagePreloadHandler.js': { GET: 'staticRouter' },
	'/dist/app.js': { GET: 'staticRouter' },
	'/dist/index.js': { GET: 'staticRouter' },
	'/dist/pages/about.js': { GET: 'staticRouter' },
	'/dist/pages/confirm.js': { GET: 'staticRouter' },
	'/dist/pages/contact.js': { GET: 'staticRouter' },
	'/dist/pages/dashboard.js': { GET: 'staticRouter' },
	'/dist/pages/faq.js': { GET: 'staticRouter' },
	'/dist/pages/featureRequest.js': { GET: 'staticRouter' },
	'/dist/pages/feedback.js': { GET: 'staticRouter' },
	'/dist/pages/globalConstants.js': { GET: 'staticRouter' },
	'/dist/pages/help.js': { GET: 'staticRouter' },
	'/dist/pages/index.js': { GET: 'staticRouter' },
	'/dist/pages/login.js': { GET: 'staticRouter' },
	'/dist/pages/notFound.js': { GET: 'staticRouter' },
	'/dist/pages/pages.js': { GET: 'staticRouter' },
	'/dist/pages/passwordReset.js': { GET: 'staticRouter' },
	'/dist/pages/privacyPolicy.js': { GET: 'staticRouter' },
	'/dist/pages/register.js': { GET: 'staticRouter' },
	'/dist/pages/resources.js': { GET: 'staticRouter' },
	'/dist/pages/securityAcknowledgements.js': { GET: 'staticRouter' },
	'/dist/pages/securityPolicy.js': { GET: 'staticRouter' },
	'/dist/pages/sitemap.js': { GET: 'staticRouter' },
	'/dist/pages/tos.js': { GET: 'staticRouter' },
	'/dist/pages/tour.js': { GET: 'staticRouter' }
};

const staticIconRouteTable = {
	'/assets/icons/icon-android-chrome.png': { GET: 'staticRouter' },
	'/assets/icons/icon.svg': { GET: 'staticRouter' }
};

const staticImageRouteTable = {
	'/assets/images/background.png': { GET: 'staticRouter' }
};

const staticKeyRouteTable = {
	'/assets/keys/viihna@viihnatech.com_email_key.asc': { GET: 'staticRouter' },
	'/assets/keys/viihna@viihnatech.com_encryption_key.asc': { GET: 'staticRouter' },
	'/assets/keys/viihna@viihnatech.com_signing_key.asc': { GET: 'staticRouter' }
};

const staticLogosRouteTable = {
	'/assets/logos/logo.png': { GET: 'staticRouter' }
}

const staticMDRouteTable = {
	'/humans.md': { GET: 'staticRouter' },
	'/LICENSE.md': { GET: 'staticRouter' },
	'/security.md': { GET: 'staticRouter' }
};

const staticTXTRouteTable = {
	'/robots.txt': { GET: 'staticRouter' }
};

const staticXMLRouteTable = {
	'/sitemap.xml': { GET: 'staticRouter' }
};

//
///
//// ***** END STATIC ROUTE TABLE COMPONENTS *****
///
//

export const apiRouteTable = {
	'/confirm.html': { POST: 'apiRouter' },
	'/dashboard.html': {
		DELETE: 'apiRouter',
		POST: 'apiRouter',
		PUT: 'apiRouter'
	},
	'/feature-request.html': { POST: 'apiRouter' },
	'/feedback.html': { POST: 'apiRouter' },
	'/generate-email-mfa': { POST: 'apiRouter' },
	'/generate-totp': { POST: 'apiRouter' },
	'/login.html': { POST: 'apiRouter' },
	'/password-reset.html': { POST: 'apiRouter' },
	'/recover-password.html': { POST: 'apiRouter' },
	'/register.html': { POST: 'apiRouter' },
	'/verify-email-mfa': { POST: 'apiRouter' },
	'/verify-totp': { POST: 'apiRouter' }
};

export const healthRouteTable = {
	'/health.html': {
		DELETE: 'healthRouter',
		GET: 'healthRouter',
		POST: 'healthRouter',
		PUT: 'healthRouter'
	}
};

export const staticRouteTable = {
	...staticCSSRouteTable,
	...staticHTMLRouteTable,
	...staticJSRouteTable,
	...staticIconRouteTable,
	...staticImageRouteTable,
	...staticKeyRouteTable,
	...staticLogosRouteTable,
	...staticMDRouteTable,
	...staticTXTRouteTable,
	...staticXMLRouteTable
}

export const testRouteTable = {
	'/test.html': {
		CONNECT: 'testRouter',
		DELETE: 'testRouter',
		GET: 'testRouter',
		HEAD: 'testRouter',
		OPTIONS: 'testRouter',
		PATCH: 'testRouter',
		POST: 'testRouter',
		PUT: 'testRouter',
		TRACE: 'testRouter'
	}
};

/* *DEV-NOTE* These routes will be part of the user dashboard, and will not have their own, individual html files

1. /generate-email-mfa
2. /generate-totp
3. /verify-email-mfa
4. /verify-totp

// The following routes have not yet been defined in their respective routers

A. API Router

	1. /confirm.html [POST]
	2. /dashboard.html [DELETE, POST, PUT]
	3. /feature-request.html [POST]
	4. /feedback.html [POST]
	5. /password-reset.html [POST]


B. Health Router

	1. /health.html [DELETE, POST, PUT]

*/
