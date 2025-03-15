export interface EnvVars {
	EMAIL_HOST: string;
	EMAIL_PASSWORD: string;
	EMAIL_PORT: number;
	EMAIL_SECURE: boolean;
	EMAIL_USER: string;

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

	LOG_ARCHIVE_DIR: string;
	LOG_DIR: string;
	LOG_LEVEL: string;
	LOG_RETENTION_DAYS: number;

	POSTGRES_DB: string;
	POSTGRES_HOST: string;
	POSTGRES_PASSWORD: string;
	POSTGRES_PORT: number;
	POSTGRES_USER: string;
	SERVER_HOST: string;
	SERVER_PORT: number;
}
