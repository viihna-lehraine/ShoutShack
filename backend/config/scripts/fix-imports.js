import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../../dist');

const fixImports = (dir) => {
	try {
		fs.readdirSync(dir).forEach(file => {
			const filePath = path.join(dir, file);
			const stats = fs.statSync(filePath);

			if (stats.isDirectory()) {
				fixImports(filePath);
			} else if (path.extname(file) === '.js') {
				let content = fs.readFileSync(filePath, 'utf-8');

				// regex to find import/export statements without .js extensions
				content = content.replace(/(import\s.+from\s+['"])(\.\/.+)(['"])/g, '$1$2.js$3');
				content = content.replace(/(export\s.+from\s+['"])(\.\/.+)(['"])/g, '$1$2.js$3');

				// write updated content back to file
				fs.writeFileSync(filePath, content, 'utf-8');
				console.log(`Fixed imports in ${filePath}`);
			}
		});
	} catch (err) {
		console.error('Experienced error while fixing imports');
		throw new err;
	}
}

fixImports(distDir);
