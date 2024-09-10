import fs from 'fs';
import path from 'path';

const __dirname = process.cwd();

const filesToClean = [
	{
		filePath: path.join(__dirname, './dist/middleware/slowdown.mjs'),
		importLine: "import '../../types/custom/express-session';\n"
	}
];

filesToClean.forEach(({ filePath, importLine }) => {
	const fileContent = fs.readFileSync(filePath, 'utf8');
	const updatedContent = fileContent.replace(importLine, '');

	if (fileContent !== updatedContent) {
		fs.writeFileSync(filePath, updatedContent, 'utf8');
		console.log(`Removed the import line from ${filePath}`);
		console.log('BEGONE THOT!');
	} else {
		console.log(`The import line was not found in ${filePath}`);
	}
});
