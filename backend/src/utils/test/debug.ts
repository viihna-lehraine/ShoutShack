import debug, { Debugger } from 'debug';

interface DebugUtilDependencies {
	debug: typeof debug;
}

export default function createDebugUtil({ debug }: DebugUtilDependencies): {
	log: Debugger;
	dbLog: Debugger;
	logError: (message: string, error: Error) => void;
} {
	const log = debug('app:server');
	const dbLog = debug('app:db');

	function logError(message: string, error: Error): void {
		log(`${message}:`, error);
	}

	return {
		log,
		dbLog,
		logError
	};
}
