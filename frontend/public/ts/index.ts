import { globalConstants } from './modules/config/globalConstants';
import { initializeDashboardPage } from './pages/dashboard.js';
import { initializeLoginPage } from './pages/login.js';
import { initializePasswordResetPage } from './pages/passwordReset.js';
import { initializeRegisterPage } from './pages/register.js';
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
	initializeDashboardPage,
	initializeLoginPage,
	initializePasswordResetPage,
	initializeRegisterPage,
	sanitizeInput,
	validatePassword,
	validatePasswordsMatch,
	updatePasswordStrength,
};
