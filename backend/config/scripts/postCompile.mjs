import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';

let __filename = fileURLToPath(import.meta.url);
let __dirname = dirname(__filename);

// Defines location of compiled JS files
let jsDir = resolve(__dirname, '../../src');

console.log(`Looking for files in: ${jsDir}`);

// Recursively find all .js files in directory
function findJsFiles(dir) {
    let results = [];
    let list = fs.readdirSync(dir);

    list.forEach((file) => {
        let filePath = join(dir, file);
        let stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results.push(...findJsFiles(filePath));
        } else if (stat && stat.isFile() && file.endsWith('.js')) {
            results.push(filePath);
        }
    });

    return results;
}

// Process all found .js files
let files = findJsFiles(jsDir);

if (files.length === 0) {
    console.log('No .js files found.');
} else {
    console.log(`Found .js files: ${files}`);
    files.forEach((file) => addJsExtension(file));
}

// Ensures all import statements have exactly 1 instance of the .js extension
function addJsExtension(filePath) {
    console.log(`Processing file: ${filePath}`);

    let fileContent = fs.readFileSync(filePath, 'utf8');

    // Update imports without extensions
    let updatedContent = fileContent.replace(
        /import\s+(.+?)\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/g,
        (fullMatch, imports, path) => {
            console.log(`Original import: ${fullMatch}`);
            if (!/\.\w+$/.test(path)) {
                let updatedPath = `import ${imports} from '${path}.js'`;
                console.log(`Updated import: ${updatedPath}`);
                return updatedPath;
            }
            return fullMatch;
        }
    );

    // Handle special cases where `index` files are imported
    updatedContent = updatedContent.replace(
        /import\s+(.+?)\s+from\s+['"](.*?\/index)['"]/g,
        (fullMatch, imports, path) => {
            console.log(`Original import for '/index': ${fullMatch}`);
            let updatedPath = `import ${imports} from '${path}.js'`;
            console.log(`Updated import for '/index': ${updatedPath}`);
            return updatedPath;
        }
    );

    // Write updated content back to the JS file if there are changes
    if (fileContent !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated and wrote back file: ${filePath}`);
    } else {
        console.log(`No changes needed for file: ${filePath}`);
    }
}

console.log('Added .js extensions to import statements.');
