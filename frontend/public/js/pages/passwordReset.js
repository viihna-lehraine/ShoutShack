export function initializePasswordReset() {
    document.addEventListener('DOMContentLoaded', function () {
        document
            .getElementById('password-reset-form')
            .addEventListener('submit', async (e) => {
            e.preventDefault();
        });
    });
}
