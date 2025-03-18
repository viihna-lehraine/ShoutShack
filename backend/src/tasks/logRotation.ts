// File: backend/src/tasks/logRotation.ts

import fs from 'fs-extra';
import path from 'path';
import { env } from '../env/load.js';

const logDir = env.LOG_DIR || path.resolve(process.cwd(), 'logs');
const archiveDir = env.LOG_ARCHIVE_DIR || path.resolve(logDir, 'archive');

console.log(`DEBUG: LOG_ARCHIVE_DIR is set to: ${env.LOG_ARCHIVE_DIR}`);
console.log(`DEBUG: LOG_DIR is set to: ${env.LOG_DIR}`);

fs.ensureDirSync(logDir);
fs.ensureDirSync(archiveDir);

export const rotateLogs = async () => {
	console.log('Running Log Rotation Task...');

	try {
		const files = await fs.readdir(logDir);

		for (const file of files) {
			const filePath = path.join(logDir, file);
			const stats = await fs.stat(filePath);
			const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

			if (fileAge > env.LOG_RETENTION_DAYS) {
				await fs.move(filePath, path.join(archiveDir, file));
				console.log(`Archived: ${file}`);
			}
		}
	} catch (error) {
		console.error('Error during log rotation:', error);
	}
};
