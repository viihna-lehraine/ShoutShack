// File: frontend/src/scripts/events/modals.ts

export async function addModalListeners(): Promise<void> {
	try {
		const loginModal = document.getElementById('login-modal') as HTMLElement;
		const signUpModal = document.getElementById('signup-modal') as HTMLElement;
		const forgotPasswordModal = document.getElementById('forgot-password-modal') as HTMLElement;

		const openLoginBtn = document.getElementById('open-login-modal');
		const openSignUpBtn = document.getElementById('open-signup-modal');
		const openForgotPasswordBtn = document.getElementById('open-forgot-password-modal');

		const closeLoginBtn = document.getElementById('close-login-modal');
		const closeSignUpBtn = document.getElementById('close-signup-modal');
		const closeForgotPasswordBtn = document.getElementById('close-forgot-password-modal');

		if (
			!loginModal ||
			!signUpModal ||
			!forgotPasswordModal ||
			!openLoginBtn ||
			!openSignUpBtn ||
			!openForgotPasswordBtn ||
			!closeLoginBtn ||
			!closeSignUpBtn ||
			!closeForgotPasswordBtn
		) {
			console.error('One or more modal elements not found!');
			return;
		}

		openLoginBtn.addEventListener('click', () => {
			console.log(`Opening login modal...`);
			loginModal.classList.add('show');
		});
		openSignUpBtn.addEventListener('click', () => {
			console.log('Opening signup modal...');
			signUpModal.classList.add('show');
		});
		openForgotPasswordBtn.addEventListener('click', () => {
			loginModal.classList.remove('show');
			forgotPasswordModal.classList.add('show');
		});

		closeLoginBtn.addEventListener('click', () => {
			console.log('Closing login modal...');
			loginModal.classList.remove('show');
		});
		closeSignUpBtn.addEventListener('click', () => {
			console.log('Closing signup modal...');
			signUpModal.classList.remove('show');
		});
		closeForgotPasswordBtn.addEventListener('click', () => {
			forgotPasswordModal.classList.remove('show');
		});

		function closeOnOutsideClick(modal: HTMLElement) {
			modal.addEventListener('click', e => {
				console.log(`Clicked on:`, e.target);
				console.log(`Modal itself is:`, modal);

				if (e.target === modal) {
					console.log('Closing modal (outside click)...');
					modal.classList.remove('show');
				} else {
					console.log('Click detected inside modal content.');
				}
			});
		}

		closeOnOutsideClick(loginModal);
		closeOnOutsideClick(signUpModal);
		closeOnOutsideClick(forgotPasswordModal);

		document.addEventListener('keydown', e => {
			if (e.key === 'Escape') {
				if (loginModal.classList.contains('show')) {
					console.log('Closing login modal (Escape key)...');
					loginModal.classList.remove('show');
				}
				if (signUpModal.classList.contains('show')) {
					console.log('Closing signup modal (Escape key)...');
					signUpModal.classList.remove('show');
				}
				if (forgotPasswordModal.classList.contains('show')) {
					console.log('Closing forgot password modal (Escape key)...');
					forgotPasswordModal.classList.remove('show');
				}
			}
		});
	} catch (error) {
		console.error('Error adding modal event listeners:', error);
	}
}
