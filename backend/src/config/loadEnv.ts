import path from 'path';
import { config } from 'dotenv';

// Declare process to capture cwd
let __dirname = process.cwd();

function loadEnv() {
	const envPath = path.join(__dirname, 'backend.dev.env');
	console.log(`Loading environment from: ${envPath}`);

	config({ path: envPath });
}

export { __dirname };
export default loadEnv;
