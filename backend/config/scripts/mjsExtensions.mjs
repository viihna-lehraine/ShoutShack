import { fileURLToPath } from 'url';
import { dirname, resolve, join, relative } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, '../../dist');

console.log('mjsExtensions script has started.');

async function renameJsToMjs(dir) {
	try {
		const list = await fs.readdir(dir, { withFileTypes: true });

		for (const file of list) {
			const filePath = join(dir, file.name);
			if (file.isDirectory()) {
				console.log(
					`Entering directory: ${relative(distDir, filePath)}`
				);
				await renameJsToMjs(filePath);
			} else if (file.isFile() && file.name.endsWith('.js')) {
				const newFilePath = filePath.replace(/\.js$/, '.mjs');
				console.log(
					`Renaming ${relative(distDir, filePath)} to ${relative(distDir, newFilePath)}`
				);
				await fs.rename(filePath, newFilePath);
				console.log(`Renamed ${relative(distDir, newFilePath)}`);
			}
		}
	} catch (error) {
		console.error(`Error renaming files in ${dir}:`, error);
	}
}

async function findMjsFiles(dir) {
	try {
		const results = [];
		const list = await fs.readdir(dir, { withFileTypes: true });

		for (const file of list) {
			const filePath = join(dir, file.name);
			if (file.isDirectory()) {
				console.log(
					`Searching in directory: ${relative(distDir, filePath)}`
				);
				const subDirFiles = await findMjsFiles(filePath);
				results.push(...subDirFiles);
			} else if (file.isFile() && file.name.endsWith('.mjs')) {
				results.push(filePath);
			}
		}
		return results;
	} catch (error) {
		console.error(`Error finding .mjs files in ${dir}:`, error);
		return []; // Return an empty array in case of an error
	}
}

async function fixImportStatements(filePath) {
	try {
		const fileContent = await fs.readFile(filePath, 'utf8');
		let modified = false;

		const updatedContent = fileContent.replace(
			/import\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+?)(\.js|\.mjs)?['"]/g,
			(fullMatch, imports, path) => {
				const updatedPath = `import ${imports.trim()} from '${path}.mjs'`;
				console.log(
					`Updating imports in ${relative(distDir, filePath)} - ${fullMatch} -> ${updatedPath}`
				);
				modified = true;
				return updatedPath;
			}
		);

		if (modified) {
			await fs.writeFile(filePath, updatedContent, 'utf8');
			console.log(
				`Successfully updated imports in ${relative(distDir, filePath)}`
			);
		} else {
			console.log(`No imports updated in ${relative(distDir, filePath)}`);
		}
	} catch (error) {
		console.error(`Error processing imports in ${filePath}:`, error);
	}
}

async function processFiles() {
	try {
		await renameJsToMjs(distDir);

		const files = await findMjsFiles(distDir);

		if (files.length === 0) {
			console.log('No .mjs files found.');
		} else {
			console.log(`Found ${files.length} .mjs files. Processing...`);
			await Promise.all(files.map(file => fixImportStatements(file)));
		}

		console.log('mjsExtensions script has completed.');
	} catch (err) {
		console.error('Error processing files:', err);
	}
}

processFiles();
