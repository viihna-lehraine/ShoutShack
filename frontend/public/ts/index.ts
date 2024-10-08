import { globalConstants } from './modules/config/globalConstants';
import { initializeAboutPage } from './pages/about';
import { initializeConfirmPage } from './pages/confirm';
import { initializeContactPage } from './pages/contact';
import { initializeDashboardPage } from './pages/dashboard';
import { initializeFaqPage } from './pages/faq';
import { initializeFeatureRequestPage } from './pages/featureRequest';
import { initializeFeedbackPage } from './pages/feedback';
import { initializeHelpPage } from './pages/help';
import { initializeIndexPage } from './pages/index';
import { initializeLoginPage } from './pages/login';
import { initializeNotFoundPage } from './pages/notFound';
import { initializePasswordResetPage } from './pages/passwordReset';
import { initializePrivacyPolicyPage } from './pages/privacyPolicy';
import { initializeRegisterPage } from './pages/register';
import { initializeResourcesPage } from './pages/resources';
import { initializeSecurityAcknowledgementsPage } from './pages/securityAcknowledgements';
import { initializeSecurityPolicyPage } from './pages/securityPolicy';
import { initializeSitemapPage } from './pages/sitemap';
import { initializeTosPage } from './pages/tos';
import { initializeTourPage } from './pages/tour';
import {
	sanitizeInput,
	validatePassword,
	validatePasswordsMatch,
	updatePasswordStrength
} from './utils/utils.js';

export const { PORT } = globalConstants;
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
	updatePasswordStrength
};
