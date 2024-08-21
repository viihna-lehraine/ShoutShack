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

const maxTarballs = 10;

const getBackupNumber = () => {
	let files = fs.readdirSync(backupsDir);
	let backupNumbers = files
		.map((file) => {
			const match = file.match(/^srcBackup(\d+)\.tar\.gz$/);
			return match ? parseInt(match[1], 10) : null;
		})
		.filter((num) => num !== null);
	return backupNumbers.length > 0 ? Math.max(...backupNumbers) + 1 : 1;
};

// Function to get the current bundle number
const getBundleNumber = () => {
	let files = fs.readdirSync(backupsDir);
	let bundleNumbers = files
		.map((file) => {
			const match = file.match(/^srcBackupBundle(\d+)\.tar\.gz$/);
			return match ? parseInt(match[1], 10) : null;
		})
		.filter((num) => num !== null);
	return bundleNumbers.length > 0 ? Math.max(...bundleNumbers) + 1 : 1;
};

const createSrcBackup = () => {
	let backupNumber = getBackupNumber();
	let backupFileName = `srcBackup${backupNumber}.tar.gz`;
	let timestampFileName = `timestamp-${backupNumber}.txt`;
	let timestamp = new Date().toISOString();

	// Create timestamp file
	fs.writeFileSync(
		path.join(srcDir, timestampFileName),
		`backup created on ${timestamp}\n`
	);

	// Create tarball including the timestamp file
	tar.c(
		{
			gzip: true,
			file: path.join(backupsDir, backupFileName),
			cwd: srcDir
		},
		['.', timestampFileName]
	)
		.then(() => {
			console.log(`Backup ${backupFileName} created successfully.`);
			// Clean up timestamp file after backup
			fs.unlinkSync(path.join(srcDir, timestampFileName));
		})
		.catch((err) => console.error(`Error creating backup: ${err.message}`));
};

const bundleTarballs = () => {
	let tarballs = fs
		.readdirSync(backupsDir)
		.filter(
			(file) =>
				file.endsWith('.tar.gz') && !file.startsWith('srcBackupBundle')
		);

	if (tarballs.length >= maxTarballs) {
		const bundleNumber = getBundleNumber(); // Get the correct bundle number
		const bundleName = `srcBackupBundle${bundleNumber}.tar.gz`;
		const bundlePath = path.join(backupsDir, bundleName);

		const tarballPaths = tarballs
			.slice(0, maxTarballs)
			.map((tarball) => path.join(backupsDir, tarball));

		tar.c(
			{
				gzip: true,
				file: bundlePath,
				cwd: backupsDir
			},
			tarballPaths.map((p) => path.basename(p))
		)
			.then(() => {
				tarballPaths.forEach((tarball) => fs.unlinkSync(tarball));
				console.log(`Bundled tarballs into: ${bundleName}`);
			})
			.catch((err) => {
				console.error(`Error bundling tarballs: ${err.message}`);
			});
	} else {
		console.log('Not enough tarballs to bundle.');
	}
};

createSrcBackup();
bundleTarballs();
