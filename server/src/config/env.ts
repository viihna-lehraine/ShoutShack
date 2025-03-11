// File: server/src/config/env.ts

import { EnvVars } from '../types/index.js';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { utils } from '../common/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
	path.resolve(__dirname, '../../conf/.env'), // when running compiled JS from 'build/'
	path.resolve(__dirname, '../../../conf/.env'), // when running via ts-node from 'src/'
	path.resolve(process.cwd(), 'server/conf/.env') // absolute fallback
];

const ENV_PATH = envPaths.find(fs.existsSync);

if (ENV_PATH) {
	console.log(`Loading environment variables from ${ENV_PATH}`);
	dotenv.config({ path: ENV_PATH });
} else {
	throw new Error(`The .env file could not be found in any of its expected locations!`);
}

export const env: EnvVars = {
	POSTGRES_DB: utils.parseString(process.env.POSTGRES_DB, 'POSTGRES_DB'),
	POSTGRES_HOST: utils.parseString(process.env.POSTGRES_HOST, 'POSTGRES_HOST'),
	POSTGRES_PASSWORD: utils.parseString(process.env.POSTGRES_PASSWORD, 'POSTGRES_PASSWORD'),
	POSTGRES_PORT: utils.parseNumber(process.env.POSTGRES_PORT),
	POSTGRES_USER: utils.parseString(process.env.POSTGRES_USER, 'POSTGRES_USER'),
	SERVER_HOST: utils.parseString(process.env.SERVER_HOST, 'SERVER_HOST'),
	SERVER_PORT: utils.parseNumber(process.env.SERVER_PORT),
	ALLOW_UPLOADS: utils.parseBoolean(process.env.ALLOW_UPLOADS)
} as const;

console.log('Loaded environment variables:', env);
