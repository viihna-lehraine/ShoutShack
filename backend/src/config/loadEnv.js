import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
	const envPath = path.join(__dirname, '../../backend.dev.env');
	const result = dotenv.config({ path: envPath });

	// Check for presence and values of variables from .env
	/* if (result.error) {
		console.log('Error loading .env file: ', result.error);
	} else {
		console.log('Parsed environment variables: ', result.parsed);
	} */
}

export { __filename, __dirname };
export default loadEnv;
