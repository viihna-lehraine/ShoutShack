// File: server/src/types/index.ts

export { AppError } from './classes/ErrorClasses.js';

export interface Database {
	users: {
		id?: number;
		email: string;
		password: string;
		verified: boolean;
		verification_token: string | null;
		created_at?: Date;
	};
}

export interface EnvVars {
	CPU_THRESHOLD: number;
	CPU_LIMIT: number;
	MEMORY_THRESHOLD: number;
	MEMORY_LIMIT: number;
	DISK_IO_THRESHOLD: number;
	DISK_IO_LIMIT: number;
	DISK_SPACE_THRESHOLD: number;
	NETWORK_THRESHOLD: number;
	NETWORK_LIMIT: number;
	MAX_CACHE_ENTRY_SIZE: number;
	MAX_CACHE_SIZE: number;

	JWT_SECRET: string;
	PEPPER: string;
	A2_MEMCOST: number;
	A2_TIMECOST: number;
	A2_PARALLELISM: number;

	ALLOW_UPLOADS: boolean;

	LOG_LEVEL: string;

	POSTGRES_DB: string;
	POSTGRES_HOST: string;
	POSTGRES_PASSWORD: string;
	POSTGRES_PORT: number;
	POSTGRES_USER: string;
	SERVER_HOST: string;
	SERVER_PORT: number;
}

export interface MutexContract {
	lock(): Promise<void>;
	unlock(): void;
}

export interface StaticParams {
	'*': string;
}

export interface Utilities {
	parseBoolean: (value: string | undefined) => boolean;
	parseNumber: (value: string | undefined) => number;
	parseString: (value: string | undefined, envVarName: string) => string;
}
