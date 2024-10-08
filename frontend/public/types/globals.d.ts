declare module 'zxcvbn' {
	interface ZxcvbnResult {
		score: number;
		feedback: {
			suggestions: string[];
			warning: string;
		};
		guesses: number;
		guesses_log10: number;
	}

	const zxcvbn: (password: string) => ZxcvbnResult;

	export default zxcvbn;
}

interface ImportMeta {
	hot?: {
		accept: (path?: string, callback?: () => void) => void;
		dispose: (callbackl: (data: unknown) => void) => void;
	};
}
