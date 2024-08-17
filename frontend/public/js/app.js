// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))
// app.js - Frontend JS Entrypoint
import { decryptSecrets } from './modules/config/sops.js';
import { initializeDashboard, initializeLogin, initializePasswordReset, initializeRegister, } from './index.js';
// Load secrets and configurations
(async () => {
    // Load secrets and configurations
    const secrets = await decryptSecrets();
    // Map page IDs to their corresponding initialization functions
    const pageInitializers = {
        'dashboard-page': initializeDashboard,
        'login-page': initializeLogin,
        'password-reset': initializePasswordReset,
        'register-page': initializeRegister,
    };
    const currentPageId = document.body.id;
    // Initialize the app if an initializer exists for the current page
    if (pageInitializers[currentPageId]) {
        pageInitializers[currentPageId](secrets);
    }
    else {
        console.warn(`No initializer found for page ${currentPageId}`);
    }
})();
