// File: backend/src/config/load.ts
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
}
else {
    throw new Error(`The .env file could not be found in any of its expected locations!`);
}
export const env = {
    NODE_ENV: utils.parseString(process.env.NODE_ENV, 'NODE_ENV'),
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
    LOG_ARCHIVE_DIR: process.env.NODE_ENV === 'dev'
        ? './logs/archive'
        : utils.parseString(process.env.LOG_ARCHIVE_DIR, 'LOG_ARCHIVE_DIR'),
    LOG_DIR: process.env.NODE_ENV === 'dev'
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
};
console.log('Loaded environment variables.');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lbnYvbG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxtQ0FBbUM7QUFHbkMsT0FBTyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ3BCLE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQ3BDLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFaEQsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUUzQyxNQUFNLFFBQVEsR0FBRztJQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLHdDQUF3QztJQUNwRixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLHVDQUF1QztJQUN0RixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLG9CQUFvQjtDQUNyRSxDQUFDO0FBRUYsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFOUMsSUFBSSxRQUFRLEVBQUUsQ0FBQztJQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDOUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ25DLENBQUM7S0FBTSxDQUFDO0lBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxvRUFBb0Us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