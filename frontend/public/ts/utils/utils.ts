function sanitizeInput(input: string) {
	input = input.trim();
	input = input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	input = input
		.replace(/&/, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;');
	input = input.replace(/\//g, '&#x2F;');

	return input;
}

function validatePassword(password: string): boolean {
	const passwordRequirements =
		/^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*\p{N})(?=.*[\p{L}\p{N}\p{P}\p{S}\s]).{8,128}$/u;
	return passwordRequirements.test(password);
}

function validatePasswordsMatch() {
	const password = (document.getElementById(
		'registration-box-user-password-input'
	) as HTMLInputElement).value;
	const confirmPassword = (document.getElementById(
		'registration-box-user-password-confirm-input'
	) as HTMLInputElement).value;

	if (password !== confirmPassword) {
        (document
			.getElementById('registration-box-user-password-confirm-input') as HTMLInputElement)
			.setCustomValidity('Passwords do not match!');
	} else {
		(document
			.getElementById('registration-box-user-password-confirm-input') as HTMLInputElement)
			.setCustomValidity('');
	}
}

function updatePasswordStrength() {
	const password = (document.getElementById(
		'registration-box-user-password-input'
	) as HTMLInputElement).value;
	const result = zxcvbn(password);

	const meter = document.getElementById('password-stength-meter')!;
	const text = document.getElementById('password-strength-text')!;

	meter.style.width = `${result.score * 25}%`;

	const strengthText = ['Very weak', 'Weak', 'Medium', 'Strong', 'Very strong'];

	text.innerText = strengthText[result.score];
	text.style.color = result.score < 3 ? 'red' : 'green';
}

export {
	sanitizeInput,
	validatePassword,
	validatePasswordsMatch,
	updatePasswordStrength,
};
