import { sanitizeInput, validatePassword } from '../index.js';
export function initializeLogin(secrets) {
    document
        .getElementById('login-box-form')
        .addEventListener('submit', async (e) => {
        e.preventDefault();
        // sanitize and validate input values
        const username = sanitizeInput(document.getElementById('login-box-user-username-input').value);
        const email = sanitizeInput(document.getElementById('login-box-user-email-input').value);
        const password = sanitizeInput(document.getElementById('login-box-user-password-input').value);
        console.log('Sanitized username, email, and password user inputs');
        if (!validatePassword(password)) {
            alert('Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character');
            return;
        }
        if (!secrets) {
            console.error('Secrets are not provided');
            alert('Configuration error. Please try again later.');
            return;
        }
        try {
            const response = await fetch(`https://localhost:${secrets.SERVER_PORT}/index`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });
            if (!response.ok) {
                // handle different response status codes
                if (response.status === 400) {
                    alert('Invalid login credentials. Please check your username and password.');
                }
                else if (response.status === 500) {
                    alert('Server error. Please try again later.');
                }
                else {
                    alert('Unexpected error. Please try again.');
                }
                return;
            }
            // Assuming the response is JSON
            const data = await response.json();
            // Handle successful response
            console.log('Login successful:', data);
            // *DEV-NOTE* add login success logic here
        }
        catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred. Please try again.');
        }
    });
}
