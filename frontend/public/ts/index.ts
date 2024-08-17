import { globalConstants } from './modules/config/globalConstants';
import { initializeAboutPage } from './pages/about.js';
import { initializeConfirmPage } from './pages/confirm.js';
import { initializeContactPage } from './pages/contact.js';
import { initializeDashboardPage } from './pages/dashboard.js';
import { initializeFaqPage } from './pages/faq.js';
import { initializeFeatureRequestPage } from './pages/featureRequest.js';
import { initializeFeedbackPage } from './pages/feedback.js';
import { initializeHelpPage } from './pages/help.js';
import { initializeIndexPage } from './pages/index.js';
import { initializeLoginPage } from './pages/login.js';
import { initializeNotFoundPage } from './pages/notFound.js';
import { initializePasswordResetPage } from './pages/passwordReset.js';
import { initializePrivacyPolicyPage } from './pages/privacyPolicy.js';
import { initializeRegisterPage } from './pages/register.js';
import { initializeResourcesPage } from './pages/resources.js';
import { initializeSecurityAcknowledgementsPage } from './pages/securityAcknowledgements.js';
import { initializeSecurityPolicyPage } from './pages/securityPolicy.js';
import { initializeSitemapPage } from './pages/sitemap.js';
import { initializeTosPage } from './pages/tos.js';
import { initializeTourPage } from './pages/tour.js';
import {
	sanitizeInput,
	validatePassword,
	validatePasswordsMatch,
	updatePasswordStrength,
} from './utils/utils.js';

export const { 
	PORT
 } = globalConstants;
export {
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
	initializeSecurityPolicyPage,
	initializeSitemapPage,
	initializeTosPage,
	initializeTourPage,
	sanitizeInput,
	validatePassword,
	validatePasswordsMatch,
	updatePasswordStrength,
};
