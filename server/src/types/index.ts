// File: server/src/types/index.ts

export interface EnvVars {
	POSTGRES_DB: string;
	POSTGRES_HOST: string;
	POSTGRES_PASSWORD: string;
	POSTGRES_PORT: number;
	POSTGRES_USER: string;
	SERVER_HOST: string;
	SERVER_PORT: number;
	ALLOW_UPLOADS: boolean;
}

export interface StaticParams {
	'*': string;
}

export interface Utilities {
	parseBoolean: (value: string | undefined) => boolean;
	parseNumber: (value: string | undefined) => number;
	parseString: (value: string | undefined, envVarName: string) => string;
}
