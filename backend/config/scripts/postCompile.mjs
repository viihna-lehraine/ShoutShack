import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mjsDir = resolve(__dirname, '../../dist');

console.log('mjsExtensions script has started.');

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
	let fileContent = await fs.readFile(filePath, 'utf8');
	let modified = false;

	fileContent = fileContent.replace(
		/import\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+?)(\.js|\.mjs)?['"]/g,
		(fullMatch, imports, path) => {
			const updatedPath = `import ${imports.trim()} from '${path}.mjs'`;
			console.log(
				`Updated import in ${filePath}: ${fullMatch} -> ${updatedPath}`
			);
			modified = true;
			return updatedPath;
		}
	);

	if (modified) {
		await fs.writeFile(filePath, fileContent, 'utf8');
	}
}

async function processFiles() {
	try {
		const files = await findMjsFiles(mjsDir);

		if (files.length === 0) {
			console.log('No .mjs files found.');
		} else {
			await Promise.all(files.map(file => fixImportStatements(file)));
		}

		console.log('mjsExtensions script has completed.');
	} catch (err) {
		console.error('Error processing files:', err);
	}
}

processFiles();
