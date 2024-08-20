import fs from 'fs';
import path from 'path';
import tar from 'tar';
import { fileURLToPath } from 'url';

let __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
let srcDir = path.join(__dirname, '../src');
let backupsDir = path.join(__dirname, '../data/src-backups');

if (!fs.existsSync(backupsDir)) {
	fs.mkdirSync(backupsDir, { recursive: true });
}

const getBackupNumber = () => {
	let files = fs.readdirSync(backupsDir);
	let backupNumbers = files
		.map(file => {
			const match = file.match(/^src-backup-(\d+)\.tar\.gz$/);
			return match ? parseInt(match[1], 10) : null;
		})
		.filter(num => num !== null);
	return backupNumbers.length > 0 ? Math.max(...backupNumbers) + 1 : 1;
};

const createSrcBackup = () => {
	let backupNumber = getBackupNumber();
	let backupFileName = `src-backup-${backupNumber}.tar.gz`;
	let timestampFileName = `timestamp-${backupNumber}.txt`;
	let timestamp = new Date().toISOString();

	fs.writeFileSync(
		path.join(backupsDir, timestampFileName),
		`Backup created on ${timestamp}\n`
	);

	tar.c(
		{
			gzip: true,
			file: path.join(backupsDir, backupFileName),
			cwd: srcDir,
		},
		['.']
	)
		.then(() => console.log(`Backup ${backupFileName} created successfully.`))
		.catch(err => console.error(`Error creating backup: ${err.message}`));
};

createSrcBackup();
