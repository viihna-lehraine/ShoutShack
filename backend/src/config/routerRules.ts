export const forbiddenDirectories = ['config/', 'node_modules/', 'scss/', 'src/', 'test/', 'ts/', 'types/']

export const forbiddenExtensions = ['.bak', '.bat', '.bz2', '.c', '.class', '.conf', '.cpp', '.crt', 'd.ts', '.dll', '.env', '.exe', '.gpg', '.gz', '.jar', '.java', '.key', '.log', '.npm', '.pem', '.php', '.ps', '.ps1', '.py', '.rar', '.rb', '.scss', '.sh', '.sql', '.swf', '.tar', '.ts', '.vbs', '.war', '.wsf', '.yaml', '.zip']

export const forbiddenFiles = ['.babelrc', '.dockerignore', '.gitignore', '.editorconfig', '.nvmrc', '.prettierignore', '.prettierrc', '.sops.yaml', '_dashboard.scss', '_global.scss', '_guestbook-blank.scss', '_index.scss', '_keyframes.scss', '_login.scss', '_security-policy.scss', '_sitemap.scss', '_variables.scss', 'backend.dev.env', 'backend.docker.env', 'backend.prod.env', 'Dockerfile', 'docker.env', 'docker-compose.yaml', 'eslint.config.js', 'jsconfig.json', 'manifest.json', 'package-lock.json', 'package.json', 'postBuild.mjs', 'start.sh', 'tsconfig.json', 'vite.config.mjs', 'webpack.common.js', 'webpack.dev.js', 'webpack.prod.js']

export const validDirectories = ['assets/', 'css/', 'dist/', 'fonts/', 'images/', 'logos/', '.pdf', 'public/', 'static/', 'styles/', 'utils/']

export const validExtensions = ['.asc', '.css', '.css.map', '.gif', '.html', '.ico', '.jpeg', '.jpg', '.js', '.map', '.md', '.mp3', '.mp4', '.otf', '.png', '.svg', '.ttf', '.txt', '.wav', '.webp', '.xml']

export const validCSSFiles = {
	main: '/css/main.css',
	map: '/css/main.css.map'
}

export const validFontFiles = {
	PLACEHOLDER: '/fonts/placeholder.ttf'
}

export const validJSFiles = {
	app: '/dist/app.js',
	index: '/dist/index.js',
	pagesAbout: '/dist/pages/about.js',
	pagesConfirm: '/dist/pages/confirm.js',
	pagesContact: '/dist/pages/contact.js',
	pagesDashboard: '/dist/pages/dashboard.js',
	pagesFaq: '/dist/pages/faq.js',
	pagesFeatureRequest: '/dist/pages/featureRequest.js',
	pagesFeedback: '/dist/pages/feedback.js',
	pagesGlobalConstants: '/dist/modules/config/globalConstants.js',
	pagsHelp: '/dist/pages/help.js',
	pagesIndex: '/dist/pages/index.js',
	pagesLogin: '/dist/pages/login.js',
	pagesNotFound: '/dist/pages/notFound.js',
	pagesPasswordReset: '/dist/pages/passwordReset.js',
	pagesPrivacyPolicy: '/dist/pages/privacyPolicy.js',
	pagesRegister: '/dist/pages/register.js',
	pagesResources: '/dist/pages/resources.js',
	pagesSecurityAcknowledgements: '/dist/pages/securityAcknowledgements.js',
	pagesSecurityPolicy: '/dist/pages/securityPolicy.js',
	pagesSitemap: '/dist/pages/sitemap.js',
	pagesTos: '/dist/pages/tos.js',
	pagesTour: '/dist/pages/tour.js',
	scriptsLoadZxcvbn: '/assets/scripts/loadZxcvbn.js',
	scriptsPagePreloadHandler: '/assets/scripts/pagePreloadHandler.js',
	utils: '/dist/utils/utils.js'
}

export const validIconFiles = {
	androidChrome: '/assets/icons/icon-android-chrome.png',
	icon: '/assets/icons/icon.svg'
}

export const validImageFiles = {
	PLACEHOLDER: '/images/placeholder.jpg'
}

export const validKeyFiles = {
	viihnaEmailKey: 'viihna@viihnatech.com_email_key.asc',
	viihnaEncryptionKey: 'viihna@viihnatech.com_encryption_key.asc',
	viihnaSigningKey: 'viihna@viihnatech.com_signing_key.asc'
}

export const validHTMLFiles = {
	about: 'about.html',
	confirm: 'confirm.html',
	contact: 'contact.html',
	cookiePolicy: 'cookie-policy.html',
	dashboard: 'dashboard.html',
	faq: 'faq.html',
	featureRequest: 'feature-request.html',
	feedback: 'feedback.html',
	help: 'help.html',
	index: 'index.html',
	login: 'login.html',
	notFound: 'not-found.html',
	passwordReset: 'password-reset.html',
	privacyPolicy: 'privacy-policy.html',
	register: 'register.html',
	resources: 'resources.html',
	securityAcknowledgements: 'security-acknowledgements.html',
	securityPolicy: 'security-policy.html',
	sitemap: 'sitemap.html',
	tos: 'tos.html',
	tour: 'tour.html'
}

export const validLogoFiles = {
	PLACEHOLDER: '/logos/placeholder.png'
}

export const validMDFiles = {
	humans: 'humans.md',
	license: 'LICENSE.md',
	security: 'security.md'
}

export const validTXTFiles = {
	robots: 'robots.txt'
}

export const validXMLFiles = {
	browserConfig: 'browser-config.xml',
	sitemap: 'sitemap.xml'
}
