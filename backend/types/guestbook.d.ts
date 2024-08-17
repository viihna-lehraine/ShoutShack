import 'express';

declare module 'express' {
	interface Request {
		csrfToken?: string;
	}
}

declare module 'eslint-plugin-no-secrets' {
	interface NoSecretsRuleOptions {
		'no-secrets': {
			allowedContent?: string[];
			forbiddenContent?: string[];
			scanDevDependencies?: boolean;
			scanGitignore?: boolean;
			scanPath?: string;
			scanCommonpath?: boolean;
			scanRecursively?: boolean;
			maxFileSizekB?: number;
			maxScanLineLength?: number;
			maxAllowedEntropy?: number;
			minTokenSize?: number;
			minNonAlphanumeric?: number;
			minNumbers?: number;
			minEntropy?: number;
			maxOccurrence?: number;
		};
	}

	interface Rules {
		'no-secrets': NoSecretsRuleOptions;
	}
}
