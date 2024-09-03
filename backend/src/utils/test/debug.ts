import debug, { Debugger } from 'debug';

interface DebugUtilDependencies {
	debug: typeof debug;
}

export default function createDebugUtil({ debug }: DebugUtilDependencies): {
	log: Debugger;
	dbLog: Debugger;
	logError: (message: string, error: Error) => void;
	logInfo: (message: string) => void;
	logWarning: (message: string) => void;
	logVerbose: (message: string) => void;
} {
	const log = debug('app:server');
	const dbLog = debug('app:db');
	const verboseLog = debug('app:verbose');

	function logError(message: string, error: Error): void {
		log(`ERROR: ${message}:`, error.stack ? error.stack : error.message);
	}

	function logInfo(message: string): void {
		log(`INFO: ${message}`);
	}

	function logWarning(message: string): void {
		log(`WARNING: ${message}`);
	}

	function logVerbose(message: string): void {
		verboseLog(`VERBOSE: ${message}`);
	}

	return {
		log,
		dbLog,
		logError,
		logInfo,
		logWarning,
		logVerbose
	};
}
