import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Defines location of compiled JS files
const jsDir = resolve(__dirname, '../../public/js');

console.log(`Looking for files in: ${jsDir}`);

// Function to recursively find all .js files in a directory
function findJsFiles(dir) {
    const results = [];
    const list = fs.readdirSync(dir);

    list.forEach((file) => {
        const filePath = join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            // Recursively search subdirectories
            results.push(...findJsFiles(filePath));
        } else if (stat && stat.isFile() && file.endsWith('.js')) {
            results.push(filePath);
        }
    });

    return results;
}

// Process all found .js files
const files = findJsFiles(jsDir);

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

    // general case for files that make fucking sense
    const updatedContent = fileContent.replace(
        /import\s+(.+?)\s+from\s+['"](\.\/[^'"]+)['"]/g,
        (fullMatch, imports, path) => {
            console.log(`Original import: ${fullMatch}`);
            if (!/\.\w+$/.test(path)) {
                const updatedPath = `import ${imports} from '${path}.js'`;
                console.log(`Updated import: ${updatedPath}`);
                return updatedPath;
            }
            return fullMatch;
        }
    );

    // additional case for replacing '../index' because login.js is very very special and refuses to let the previous check fix it and it keeps forcing me to manually add the .js extension after every TS transpilation *SCREAMS*
    fileContent = fileContent.replace(
        /import\s+(.+?)\s+from\s+['"](.*?\/index)['"]/g,
        (fullMatch, imports, path) => {
            console.log(`Original import for '../index': ${fullMatch}`);
            const updatedPath = `import ${imports} from '${path}.js'`;
            console.log(`Updated import for '../index': ${updatedPath}`);
            return updatedPath;
        }
    );

    // Write updated content back to the JS file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
}

console.log('Added .js extensions to import statements.');
