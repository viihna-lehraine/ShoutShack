interface ZxcvbnResult {
    score: number;
    feedback: {
        suggestions: string[];
        warning: string;
    };
    guesses: number;
    guesses_log10: number;
}

declare const zxcvbn: (password: string) => ZxcvbnResult;