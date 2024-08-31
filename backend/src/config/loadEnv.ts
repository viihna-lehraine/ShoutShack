import path from 'path';
import { config } from 'dotenv';

export interface LoadEnvDependencies {
	logger: {
		info: (msg: string) => void;
	};
	envFilePath?: string; // optional, but allows overriding the default path
}

export function loadEnv({ logger, envFilePath }: LoadEnvDependencies): void {
	const envPath = envFilePath || path.join(process.cwd(), '../../backend.dev.env');
	logger.info(`Loading environment variables from ${envPath}`);

	config({ path: envPath });
}
