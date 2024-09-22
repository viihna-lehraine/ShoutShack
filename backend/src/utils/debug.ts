import debug, { Debugger } from 'debug';
import { Logger } from '../services/appLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from './helpers';

interface DebugUtilDependencies {
	debug: typeof debug;
	logger: Logger;
}

export default function createDebugUtil({
	debug,
	logger
}: DebugUtilDependencies): {
	log: Debugger;
	dbLog: Debugger;
	logError: (message: string, error: Error) => void;
	logInfo: (message: string) => void;
	logWarning: (message: string) => void;
	logVerbose: (message: string) => void;
} {
	try {
		validateDependencies(
			[
				{ name: 'debug', instance: debug },
				{ name: 'logger', instance: logger }
			],
			logger
		);

		const log = debug('app:server');
		const dbLog = debug('app:db');
		const verboseLog = debug('app:verbose');

		function logError(message: string, error: Error): void {
			try {
				validateDependencies(
					[
						{ name: 'message', instance: message },
						{ name: 'error', instance: error }
					],
					logger
				);
				log(`ERROR: ${message}:`, error.stack || error.message);
			} catch (err) {
				processError(err, logger);
				throw new Error('Failed to log error message');
			}
		}

		function logInfo(message: string): void {
			try {
				validateDependencies(
					[{ name: 'message', instance: message }],
					logger
				);
				log(`INFO: ${message}`);
			} catch (err) {
				processError(err, logger);
				throw new Error('Failed to log info message');
			}
		}

		function logWarning(message: string): void {
			try {
				validateDependencies(
					[{ name: 'message', instance: message }],
					logger
				);
				log(`WARNING: ${message}`);
			} catch (err) {
				processError(err, logger);
				throw new Error('Failed to log warning message');
			}
		}

		function logVerbose(message: string): void {
			try {
				validateDependencies(
					[
						{
							name: 'message',
							instance: message
						}
					],
					logger
				);
				verboseLog(`VERBOSE: ${message}`);
			} catch (err) {
				processError(err, logger);
				throw new Error('Failed to log verbose message');
			}
		}

		return {
			log,
			dbLog,
			logError,
			logInfo,
			logWarning,
			logVerbose
		};
	} catch (error) {
		processError(error, logger);
		throw new Error(
			`Failed to create debug utility: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}
