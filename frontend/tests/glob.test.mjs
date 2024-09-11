import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const glob = require('glob').glob || require('glob');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsDir = resolve(__dirname, '../../frontend/public/js');

console.log(`Looking for files in: ${jsDir}`);

glob(`${jsDir}/*.js`, (err, files) => {
    if (!files) {
        console.error('No files found.');
        return;
    }
    if (err) {
        console.error('Error finding files:', err);
        return;
    }
    if (files.length === 0) {
        console.log('No files found.');
    } else {
        console.log(`Found files: ${files}`);
    }
});

// Unable to use glob for intended purpose. No longer using this module
