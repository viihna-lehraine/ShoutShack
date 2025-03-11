import cron from 'node-cron';
import fs from 'fs-extra';
import path from 'path';

const LOG_DIR = './logs/';
const ARCHIVE_DIR = './logs/archive/';
const RETENTION_DAYS = 7;

fs.ensureDirSync(ARCHIVE_DIR);

cron.schedule('0 0 * * *', async () => {
	try {
		console.log('📝 Running Log Rotation Task...');

		const files = await fs.readdir(LOG_DIR);

		for (const file of files) {
			const filePath = path.join(LOG_DIR, file);
			const stats = await fs.stat(filePath);
			const fileAge = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

			if (fileAge > RETENTION_DAYS) {
				await fs.move(filePath, path.join(ARCHIVE_DIR, file));
				console.log(`📂 Archived: ${file}`);
			}
		}
	} catch (err) {
		console.error('Log Rotation Error:', err);
	}
});

console.log('✅ Log Rotation Job Scheduled (Runs Daily at Midnight)');
