export interface Validate {
	email: (email: string) => boolean;
	escapeHTML(str: string): string;
	password: (password: string) => boolean;
	username: (username: string) => boolean;
	sanitizeInput: (input: string) => string;
}
