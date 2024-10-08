// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

// app.js - Frontend JS Entry Point

import {
	initializeAboutPage,
	initializeConfirmPage,
	initializeContactPage,
	initializeDashboardPage,
	initializeFaqPage,
	initializeFeatureRequestPage,
	initializeFeedbackPage,
	initializeHelpPage,
	initializeIndexPage,
	initializeLoginPage,
	initializeNotFoundPage,
	initializePasswordResetPage,
	initializePrivacyPolicyPage,
	initializeRegisterPage,
	initializeResourcesPage,
	initializeSecurityAcknowledgementsPage,
	initializeSitemapPage,
	initializeTosPage,
	initializeTourPage
} from './index';

// hot-reload support *DEV-NOTE* REMOVE IN PRODUCTION
if (import.meta.hot) {
	import.meta.hot.accept();
}

// Begin loading configurations
(async () => {
	// Map page IDs to their corresponding initialization functions
	const pageInitializers: { [key: string]: () => void } = {
		'about-page': initializeAboutPage,
		'confirm-page': initializeConfirmPage,
		'contact-page': initializeContactPage,
		'dashboard-page': initializeDashboardPage,
		'faq-page': initializeFaqPage,
		'feature-request-page': initializeFeatureRequestPage,
		'feedback-page': initializeFeedbackPage,
		'help-page': initializeHelpPage,
		'index-page': initializeIndexPage,
		'login-page': initializeLoginPage,
		'not-found-page': initializeNotFoundPage,
		'password-reset': initializePasswordResetPage,
		'privacy-policy-page': initializePrivacyPolicyPage,
		'register-page': initializeRegisterPage,
		'resources-page': initializeResourcesPage,
		'security-acknowledgements-page': initializeSecurityAcknowledgementsPage,
		'sitemap-page': initializeSitemapPage,
		'tos-page': initializeTosPage,
		'tour-page': initializeTourPage
	};

	const currentPageId: string = document.body.id;

	// Initialize the app if an initializer exists for the current page
	if (pageInitializers[currentPageId]) {
		pageInitializers[currentPageId]();
	} else {
		console.warn(`No initializer found for page ${currentPageId}`);
	}
})();
