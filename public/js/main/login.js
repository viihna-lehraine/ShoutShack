// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const getSecrets = require('../../../src/config/sops.js');
const path = require('path');

const secrets = getSecrets();

import { sanitizeInput, validatePassword, } from '../exports.js';


document.getElementById('login-box-form').addEventListener('submit', async (e) => {
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

    const response = await fetch(`https://localhost:${secrets.PORT}}/index`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    })

    try {
        const response = await fetch(`https://localhost:${secrets.PORT}/index`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) { // handle different response status codes
            if (response.status === 400) {
                alert('Invalid login credentials. Please check your username and password.');
            } else if (response.status === 500) {
                alert('Server error. Please try again later.');
            } else {
                alert('Unexpected error. Please try again.');
            }
            return;
        }

        // Assuming the response is JSON
        const data = await response.json();

        // Handle successful response
        console.log('Login successful:', data);
        // Redirect to a different page or show a success message
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again.');
    }
});