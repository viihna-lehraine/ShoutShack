import readline from 'readline';
import argon2 from 'argon2';

function askHiddenQuestion(query) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true
	});

	return new Promise(resolve => {
		rl.question(query, answer => {
			rl.history = rl.history.slice(1); // Clear last line from history
			rl.close();
			resolve(answer);
		});

		// Hide input on the terminal
		rl._writeToOutput = function _writeToOutput() {
			rl.output.write('*');
		};
	});
}

async function hashKeys() {
	try {
		const key = await askHiddenQuestion('Enter encryption key to hash: ');

		const hashedKey = await argon2.hash(key);

		console.log(`\nHashed key: ${hashedKey}`);
	} catch (err) {
		console.error('\nError hashing the key:', err);
	}
}

await hashKeys();
