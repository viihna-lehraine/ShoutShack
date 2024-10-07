import fs from 'fs';
import path from 'path';

const __dirname = process.cwd();

const filesToClean = [
	{
		filePath: path.join(__dirname, './dist/auth/FIDO2.mjs'),
		importLine: "import '../../types/custom/yub.d.ts';\n"
	},
	{
		filePath: path.join(__dirname, './dist/index/interfaces/main.mjs'),
		importLine: "import '../../../types/custom/winston-logstash';\n"
	},
	{
		filePath: path.join(__dirname, './dist/auth/YubicoOTP.mjs'),
		importLine: "import '../../types/custom/yub.js';\n"
	}
];

filesToClean.forEach(({ filePath, importLine }) => {
	const fileContent = fs.readFileSync(filePath, 'utf8');
	const updatedContent = fileContent.replace(importLine, '');

	console.log('Running removeTypeImports script...');

	if (fileContent !== updatedContent) {
		fs.writeFileSync(filePath, updatedContent, 'utf8');
		console.log(`Removed the import line from ${filePath}`);
		console.log('BEGONE THOT!');
	} else {
		console.log(`The import line was not found in ${filePath}`);
	}
});
