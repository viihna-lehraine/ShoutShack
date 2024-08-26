import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mjsDir = resolve(__dirname, '../../dist');

console.log(`Looking for files in: ${mjsDir}`);

async function findMjsFiles(dir) {
	const results = [];
	const list = await fs.readdir(dir, { withFileTypes: true });

	for (const file of list) {
		const filePath = join(dir, file.name);
		if (file.isDirectory()) {
			const subDirFiles = await findMjsFiles(filePath);
			results.push(...subDirFiles);
		} else if (file.isFile() && file.name.endsWith('.mjs')) {
			results.push(filePath);
		}
	}
	return results;
}

async function fixImportStatements(filePath) {
	console.log(`Processing file: ${filePath}`);

	let fileContent = await fs.readFile(filePath, 'utf8');
	let modified = false;

	fileContent = fileContent.replace(
		/import\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+?)(\.js|\.mjs)?['"]/g,
		(fullMatch, imports, path) => {
			console.log(`Original import: ${fullMatch}`);

			// Remove any existing .js or .mjs extension
			const updatedPath = `import ${imports.trim()} from '${path}.mjs'`;
			console.log(`Updated import: ${updatedPath}`);
			modified = true;
			return updatedPath;
		}
	);

	if (!modified) {
		console.log(`No changes made in: ${filePath}`);
	}

	if (modified) {
		await fs.writeFile(filePath, fileContent, 'utf8');
		console.log(`Updated and wrote back file: ${filePath}`);
	}
}

async function processFiles() {
	try {
		const files = await findMjsFiles(mjsDir);

		if (files.length === 0) {
			console.log('No .mjs files found.');
		} else {
			console.log(`Found .mjs files: ${files}`);
			await Promise.all(files.map(file => fixImportStatements(file)));
		}

		console.log('Processed import statements.');
	} catch (err) {
		console.error('Error processing files:', err);
	}
}

processFiles();
