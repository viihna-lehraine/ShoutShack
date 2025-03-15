// File: server/src/tasks/logRotation.ts

import fs from 'fs-extra';
import path from 'path';
import { env } from '../config/env.js';

fs.ensureDirSync(env.LOG_ARCHIVE_DIR);

export const rotateLogs = async () => {
	console.log('Running Log Rotation Task...');

	const files = await fs.readdir(env.LOG_DIR);
	for (const file of files) {
		const filePath = path.join(env.LOG_DIR, file);
		const stats = await fs.stat(filePath);
		const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

		if (fileAge > env.LOG_RETENTION_DAYS) {
			await fs.move(filePath, path.join(env.LOG_ARCHIVE_DIR, file));
			console.log(`Archived: ${file}`);
		}
	}
};
