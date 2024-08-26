import { resolve, join } from 'path';
import fs from 'fs';

const distDir = resolve('./dist');

function renameToMjs(dir) {
	const files = fs.readdirSync(dir);

	files.forEach(file => {
		const filePath = join(dir, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			renameToMjs(filePath);
		} else if (file.endsWith('.js')) {
			const newFilePath = filePath.replace(/\.js$/, '.mjs');
			fs.renameSync(filePath, newFilePath);
			console.log(`Renamed ${filePath} to ${newFilePath}`);
		}
	});
}

console.log(`distDir location is ${distDir}`);
renameToMjs(distDir);
console.log(`Completed renaming files in ${distDir}`);
