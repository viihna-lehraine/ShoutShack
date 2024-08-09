import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });

  console.log('Environment variables loaded');
}

export { __filename, __dirname };
export default loadEnv;
