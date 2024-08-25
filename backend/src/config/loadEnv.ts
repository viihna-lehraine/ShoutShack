import path from 'path';
import { config } from 'dotenv';
import setupLogger from './logger';

const __dirname = process.cwd();
const logger = setupLogger();

function loadEnv(): void {
	const envPath = path.join(__dirname, 'backend.dev.env');
	logger.info(`Loading environment from: ${envPath}`);

	config({ path: envPath });
}

export { __dirname };
export default loadEnv;
