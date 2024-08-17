import { PORT, sanitizeInput, validatePassword } from '../index';

// Sends a login request to the server
function handleLoginResponseError(response: Response): void {
    if (response.status === 400) {
        alert('Invalid login credentials. Please check your username and password.');
    } else if (response.status === 500) {
        alert('Server error. Please try again later.');
    } else {
        alert('Unexpected error. Please try again.');
    }
}

export function initializeLoginPage(): void {
    const formElement = document.getElementById('login-box-form');

    if (!formElement) {
        console.error('Login form not found.');
        return;
    }

    formElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            // Sanitize and validate input values
            const usernameInput = document.getElementById('login-box-user-username-input') as HTMLInputElement;
            const emailInput = document.getElementById('login-box-user-email-input') as HTMLInputElement;
            const passwordInput = document.getElementById('login-box-user-password-input') as HTMLInputElement;

            const username = sanitizeInput(usernameInput?.value);
            const email = sanitizeInput(emailInput?.value);
            const password = sanitizeInput(passwordInput?.value);

            console.log('Sanitized username, email, and password user inputs');

            if (!validatePassword(password)) {
                alert(
                    'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character'
                );
                return;
            }

            // Make the login request
            const response = await fetch(`https://localhost:${PORT}/index`, {
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
            const data = await response.json();

            // Handle successful response
            console.log('Login successful:', data);
            // *DEV-NOTE* Add login success logic here
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred. Please try again.');
        }
    });
}
