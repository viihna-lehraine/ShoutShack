var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { PORT, sanitizeInput, validatePassword } from '../index';
// Errpr jamd;omg function first
function handleLoginResponseError(response) {
    if (response.status === 400) {
        alert('Invalid login credentials. Please check your username and password.');
    }
    else if (response.status === 500) {
        alert('Server error. Please try again later.');
    }
    else {
        alert('Unexpected error. Please try again.');
    }
}
export function initializeLoginPage() {
    const formElement = document.getElementById('login-box-form');
    if (!formElement) {
        console.error('Login form not found.');
        return;
    }
    formElement.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        try {
            // Sanitize and validate input values
            const usernameInput = document.getElementById('login-box-user-username-input');
            const emailInput = document.getElementById('login-box-user-email-input');
            const passwordInput = document.getElementById('login-box-user-password-input');
            const username = sanitizeInput(usernameInput === null || usernameInput === void 0 ? void 0 : usernameInput.value);
            const email = sanitizeInput(emailInput === null || emailInput === void 0 ? void 0 : emailInput.value);
            const password = sanitizeInput(passwordInput === null || passwordInput === void 0 ? void 0 : passwordInput.value);
            console.log('Sanitized username, email, and password user inputs');
            if (!validatePassword(password)) {
                alert('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character');
                return;
            }
            // Make the login request
            const response = yield fetch(`https://localhost:${PORT}/index`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });
            if (!response.ok) {
                handleLoginResponseError(response);
                return;
            }
            // Assumes JSON reponse
            const data = yield response.json();
            // Handle successful response
            console.log('Login successful:', data);
            // *DEV-NOTE* Add login success logic here
        }
        catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred. Please try again.');
        }
    }));
}
