// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))


import { loadSecrets } from './config/sops.js';
import { initializeLogin } from './pages/login.js';
import { initializeRegister } from './pages/register.js';

// Load secrets and configurations
const secrets = loadSecrets();

// Map page IDs to their corresponding initialization functions
const pageInitializers = {
    'login-page': initializeLogin,
    'register-page': initializeRegister,
};

const currentPageId = document.body.id;

// Initialize the app if an initializer exists for the current page
if (pageInitializers[currentPageId]) {
    pageInitializers[currentPageId](secrets);
} else {
    console.warn(`No initializer found for page ${currentPageId}`);
}