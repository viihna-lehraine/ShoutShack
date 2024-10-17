import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../node-env.env') });

switch (process.env.NODE_ENV) {
	case 'dev':
    case 'development':
        dotenv.config({ path: resolve(__dirname, './config/env/dev.env') });
        console.log('Loaded development environment');
        break;

	case 'test':
    case 'testing':
        dotenv.config({ path: resolve(__dirname, './config/env/test.env') });
        console.log('Loaded testing environment');
        break;

    case 'prod':
    case 'production':
        dotenv.config({ path: resolve(__dirname, './config/env/prod.env') });
        console.log('Loaded production environment');
        break;

    default:
        console.error(`Invalid NODE_ENV: ${process.env.NODE_ENV}`);
        process.exit(1);
}
