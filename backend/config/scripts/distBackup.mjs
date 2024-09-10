import fs from 'fs/promises';
import path from 'path';
import tar from 'tar';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../../dist');
const backupsDir = path.join(__dirname, '../../data/dist-backups');

(async () => {
	try {
		await fs.mkdir(backupsDir, { recursive: true });

		const maxTarballs = 10;

		const getBackupNumber = async () => {
			const files = await fs.readdir(backupsDir);
			const backupNumbers = files
				.map(file => {
					const match = file.match(/^distBackup(\d+)\.tar\.gz$/);
					return match ? parseInt(match[1], 10) : null;
				})
				.filter(num => num !== null);
			return backupNumbers.length > 0
				? Math.max(...backupNumbers) + 1
				: 1;
		};

		const getBundleNumber = async () => {
			const files = await fs.readdir(backupsDir);
			const bundleNumbers = files
				.map(file => {
					const match = file.match(
						/^distBackupBundle(\d+)\.tar\.gz$/
					);
					return match ? parseInt(match[1], 10) : null;
				})
				.filter(num => num !== null);
			return bundleNumbers.length > 0
				? Math.max(...bundleNumbers) + 1
				: 1;
		};

		const createSrcBackup = async () => {
			const backupNumber = await getBackupNumber();
			const backupFileName = `distBackup${backupNumber}.tar.gz`;
			const timestampFileName = `timestamp-${backupNumber}.txt`;
			const timestamp = new Date().toISOString();

			await fs.writeFile(
				path.join(distDir, timestampFileName),
				`backup created on ${timestamp}\n`
			);

			await tar.c(
				{
					gzip: true,
					file: path.join(backupsDir, backupFileName),
					cwd: distDir
				},
				['.', timestampFileName]
			);

			console.log(`Backup ${backupFileName} created successfully.`);

			await fs.unlink(path.join(distDir, timestampFileName));
		};

		const bundleTarballs = async () => {
			const tarballs = (await fs.readdir(backupsDir)).filter(
				file =>
					file.endsWith('.tar.gz') &&
					!file.startsWith('distBackupBundle')
			);

			if (tarballs.length >= maxTarballs) {
				const bundleNumber = await getBundleNumber();
				const bundleName = `distBackupBundle${bundleNumber}.tar.gz`;
				const bundlePath = path.join(backupsDir, bundleName);

				const tarballPaths = tarballs
					.slice(0, maxTarballs)
					.map(tarball => path.join(backupsDir, tarball));

				await tar.c(
					{
						gzip: true,
						file: bundlePath,
						cwd: backupsDir
					},
					tarballPaths.map(p => path.basename(p))
				);

				await Promise.all(
					tarballPaths.map(tarball => fs.unlink(tarball))
				);
				console.log(`Bundled tarballs into: ${bundleName}`);
			} else {
				console.log('Not enough tarballs to bundle.');
			}
		};

		await createSrcBackup();
		await bundleTarballs();
	} catch (err) {
		console.error(`Error: ${err.message}`);
	}
})();
