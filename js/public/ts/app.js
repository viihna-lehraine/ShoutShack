// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// app.js - Frontend JS Entrypoint
import { initializeDashboardPage, initializeLoginPage, initializePasswordResetPage, initializeRegisterPage, } from './index';
// Begin loading configurations
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Map page IDs to their corresponding initialization functions
    const pageInitializers = {
        'dashboard-page': initializeDashboardPage,
        'login-page': initializeLoginPage,
        'password-reset': initializePasswordResetPage,
        'register-page': initializeRegisterPage,
    };
    const currentPageId = document.body.id;
    // Initialize the app if an initializer exists for the current page
    if (pageInitializers[currentPageId]) {
        pageInitializers[currentPageId];
    }
    else {
        console.warn(`No initializer found for page ${currentPageId}`);
    }
}))();
