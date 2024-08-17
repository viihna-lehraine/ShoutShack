// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))

// app.js - Frontend JS Entrypoint

import {
	initializeDashboardPage,
	initializeLoginPage,
	initializePasswordResetPage,
	initializeRegisterPage,
} from './index';

// Begin loading configurations
(async () => {
	// Map page IDs to their corresponding initialization functions
	const pageInitializers: { [key: string]: () => void } = {
		'dashboard-page': initializeDashboardPage,
		'login-page': initializeLoginPage,
		'password-reset': initializePasswordResetPage,
		'register-page': initializeRegisterPage,
	};

	const currentPageId: string = document.body.id;

	// Initialize the app if an initializer exists for the current page
	if (pageInitializers[currentPageId]) {
		pageInitializers[currentPageId];
	} else {
		console.warn(`No initializer found for page ${currentPageId}`);
	}
})();
