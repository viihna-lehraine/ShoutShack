import { join, resolve } from 'path';
import { promises as fs } from 'fs';

const distDir = resolve('./dist');
console.log(`removeVar is executing in ${distDir}`);

async function findMjsFiles(dir) {
	const files = await fs.readdir(dir, { withFileTypes: true });
	const results = [];

	for (const file of files) {
		const filePath = join(dir, file.name);
		if (file.isDirectory()) {
			const nestedFiles = await findMjsFiles(filePath);
			results.push(...nestedFiles);
		} else if (file.name.endsWith('.mjs')) {
			results.push(filePath);
		}
	}
	return results;
}

async function replaceExportVarWithLet(filePath) {
	const fileContent = await fs.readFile(filePath, 'utf8');
	const originalContent = fileContent;
	const modifiedContent = fileContent.replace(
		/export var (\w+)/g,
		'export let $1'
	);

	if (originalContent !== modifiedContent) {
		await fs.writeFile(filePath, modifiedContent, 'utf8');
		console.log(`Updated 'var' to 'let' in ${filePath}`);
	}
}

async function processFiles() {
	try {
		const mjsFiles = await findMjsFiles(distDir);

		if (mjsFiles.length === 0) {
			console.log('No .mjs files found.');
			return;
		}

		await Promise.all(mjsFiles.map(file => replaceExportVarWithLet(file)));

		console.log('removeVar is done.');
	} catch (error) {
		console.error('Error processing files:', error);
	}
}

processFiles();
