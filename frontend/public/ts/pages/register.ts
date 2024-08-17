import { updatePasswordStrength, validatePasswordsMatch } from '../index.js';

export function initializeRegisterPage(): void {
	document
		.getElementById('registration-form')!
		.addEventListener('submit', function (e: Event): void {
			e.preventDefault();

			const password = (document.getElementById(
				'registration-box-user-password-input'
			) as HTMLInputElement).value;
			const confirmPassword = (document.getElementById(
				'registration-box-user-password-confirm-input'
			) as HTMLInputElement).value;

			if (password !== confirmPassword) {
				alert('Passwords do not match!');
				return;
			}

			// continue with form submission
			const formData = {
				username: (document.getElementById(
					'registration-box-user-username-input'
				) as HTMLInputElement).value,
				email: (document.getElementById('registration-box-user-email-input') as HTMLInputElement).value,
				password: password,
			};

			fetch('/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			})
				.then((response) => response.json())
				.then((data) => {
					console.log('Success: ', data);
				})
				.catch((error) => {
					console.error('Error: ', error);
				});
		});

	// Change password strength meter output based on input
	document
		.getElementById('registration-box-user-password-input')!
		.addEventListener('input', updatePasswordStrength);
	document
		.getElementById('registration-box-user-confirm-password')!
		.addEventListener('input', validatePasswordsMatch);
}
