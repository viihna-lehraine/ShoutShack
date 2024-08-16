import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv(): void {
	const envPath = path.join(__dirname, '../../backend.dev.env');
}

export { __filename, __dirname };
export default loadEnv;
