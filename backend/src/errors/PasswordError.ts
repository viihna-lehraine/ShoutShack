export class PasswordValidationError extends Error {
	constructor(msg: string) {
		super(msg);
		this.name = 'PasswordValidationError';
	}
}
