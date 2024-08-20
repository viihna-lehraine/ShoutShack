// I am done fighting with TypeScript. I cannot find an elegant way to leave type imports in the TS files in a way that doesn't create runtime errors for the JS files once they're compiled
// This script is the equivalent of bringing a shotgun to a fencing match. I am no longer asking. I am going to get this server to run and I am going to do it my way
// *DEV-NOTE* Seriously though I'm gonna come back later and try to figure out a better solution for this

import fs from 'fs';
import path from 'path';

const __dirname = process.cwd();

// Define an array of file paths and their corresponding import lines to remove
const filesToClean = [
    {
        filePath: path.join(__dirname, '../src/server.js'),
        importLine: "import '../types/custom/express-async-errors';\n"
    },
    {
        filePath: path.join(__dirname, '../src/utils/auth/yubicoOtpUtil.js'),
        importLine: "import '../../../types/custom/yub.d.ts';\n"
    }
];

// Iterate over the files and remove the specified import lines
filesToClean.forEach(({ filePath, importLine }) => {
    // Read the content of the file
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Remove the specific import line
    const updatedContent = fileContent.replace(importLine, '');

    // Write the updated content back to the file if it was changed
    if (fileContent !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Removed the import line from ${filePath}`);
		console.log('BEGONE THOT!');
    } else {
        console.log(`The import line was not found in ${filePath}`);
    }
});

