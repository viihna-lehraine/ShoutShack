import path from 'path';
import { config } from 'dotenv';

// Declare process to capture cwd
const __dirname = process.cwd();

function loadEnv() {
    const envPath = path.join(__dirname, 'backend.dev.env');
    console.log(`Loading environment from: ${envPath}`);
    
    // Load environment variables from the specified file
    config({ path: envPath });
}

export default loadEnv;
