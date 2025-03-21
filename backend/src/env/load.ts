// File: backend/src/config/load.ts

import { EnvVars, NodeEnv } from '../types/index.js';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { utils } from '../common/utils/main.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
	path.resolve(__dirname, '../../conf/.env'), // when running compiled JS from 'dist/'
	path.resolve(__dirname, '../../../conf/.env'), // when running via ts-node from 'src/'
	path.resolve(process.cwd(), 'backend/conf/.env') // absolute fallback
];

const ENV_PATH = envPaths.find(fs.existsSync);

if (ENV_PATH) {
	console.log(`Loading environment variables from ${ENV_PATH}`);
	dotenv.config({ path: ENV_PATH });
} else {
	throw new Error(`The .env file could not be found in any of its expected locations!`);
}

export const env: EnvVars = {
	NODE_ENV: utils.parseString(process.env.NODE_ENV, 'NODE_ENV') as NodeEnv,

	EMAIL_HOST: utils.parseString(process.env.EMAIL_HOST, 'EMAIL_HOST'),
	EMAIL_PASSWORD: utils.parseString(process.env.EMAIL_PASSWORD, 'EMAIL_PASSWORD'),
	EMAIL_PORT: utils.parseNumber(process.env.EMAIL_PORT),
	EMAIL_SECURE: utils.parseBoolean(process.env.EMAIL_SECURE),
	EMAIL_USER: utils.parseString(process.env.EMAIL_USER, 'EMAIL_USER'),

	CPU_THRESHOLD: utils.parseNumber(process.env.CPU_THRESHOLD),
	CPU_LIMIT: utils.parseNumber(process.env.CPU_LIMIT),
	MEMORY_THRESHOLD: utils.parseNumber(process.env.MEMORY_THRESHOLD),
	MEMORY_LIMIT: utils.parseNumber(process.env.MEMORY_LIMIT),
	DISK_IO_THRESHOLD: utils.parseNumber(process.env.DISK_IO_THRESHOLD),
	DISK_IO_LIMIT: utils.parseNumber(process.env.DISK_IO_LIMIT),
	DISK_SPACE_THRESHOLD: utils.parseNumber(process.env.DISK_SPACE_THRESHOLD),
	NETWORK_THRESHOLD: utils.parseNumber(process.env.NETWORK_THRESHOLD),
	NETWORK_LIMIT: utils.parseNumber(process.env.NETWORK_LIMIT),
	MAX_CACHE_ENTRY_SIZE: utils.parseNumber(process.env.MAX_CACHE_ENTRY_SIZE),
	MAX_CACHE_SIZE: utils.parseNumber(process.env.MAX_CACHE_SIZE),

	A2_MEMCOST: utils.parseNumber(process.env.A2_MEMCOST),
	A2_TIMECOST: utils.parseNumber(process.env.A2_TIMECOST),
	A2_PARALLELISM: utils.parseNumber(process.env.A2_PARALLELISM),

	ALLOW_UPLOADS: utils.parseBoolean(process.env.ALLOW_UPLOADS),

	LOG_ARCHIVE_DIR:
		process.env.NODE_ENV === 'dev'
			? './logs/archive'
			: utils.parseString(process.env.LOG_ARCHIVE_DIR, 'LOG_ARCHIVE_DIR'),
	LOG_DIR:
		process.env.NODE_ENV === 'dev'
			? './logs/'
			: utils.parseString(process.env.LOG_DIR, 'LOG_DIR'),
	LOG_LEVEL: utils.parseString(process.env.LOG_LEVEL, 'LOG_LEVEL'),
	LOG_RETENTION_DAYS: utils.parseNumber(process.env.LOG_RETENTION_DAYS),

	POSTGRES_DB: utils.parseString(process.env.POSTGRES_DB, 'POSTGRES_DB'),
	POSTGRES_HOST: utils.parseString(process.env.POSTGRES_HOST, 'POSTGRES_HOST'),
	POSTGRES_PASSWORD: utils.parseString(process.env.POSTGRES_PASSWORD, 'POSTGRES_PASSWORD'),
	POSTGRES_PORT: utils.parseNumber(process.env.POSTGRES_PORT),
	POSTGRES_USER: utils.parseString(process.env.POSTGRES_USER, 'POSTGRES_USER'),
	SERVER_HOST: utils.parseString(process.env.SERVER_HOST, 'SERVER_HOST'),
	SERVER_PORT: utils.parseNumber(process.env.SERVER_PORT),
	WS_PORT: utils.parseNumber(process.env.WS_PORT),

	PEPPER: utils.parseString(process.env.PEPPER, 'PEPPER'),
	SESSION_SECRET: utils.parseString(process.env.SESSION_SECRET, 'SESSION_SECRET')
} as const;

console.log('Loaded environment variables.');
