import { exec, ExecException } from 'child_process';
import compressing from 'compressing';
import fs from 'fs';
import cron from 'node-cron';
import path from 'path';
import { logger, Logger } from './appLogger';
import { getSequelizeInstance } from '../config/db';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/validateDependencies';

const sequelize = getSequelizeInstance({ logger });

interface CronDependencies {
	logger: Logger;
	compressing: typeof compressing;
	exec: typeof exec;
	fs: typeof fs;
	path: typeof path;
	processEnv: NodeJS.ProcessEnv;
	__dirname: string;
}

export function createCronJobs({
	logger,
	compressing,
	exec,
	fs,
	path,
	processEnv,
	__dirname
}: CronDependencies): void {
	try {
		// Validate dependencies
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'compressing', instance: compressing },
				{ name: 'exec', instance: exec },
				{ name: 'fs', instance: fs },
				{ name: 'path', instance: path },
				{ name: 'processEnv', instance: processEnv },
				{ name: '__dirname', instance: __dirname }
			],
			logger
		);

		if (
			!processEnv.SERVER_LOG_PATH ||
			!processEnv.SERVER_NPM_LOG_PATH ||
			!processEnv.BACKEND_LOGGER_EXPORT_PATH
		) {
			throw new Error(`Required environment variables are missing`);
		}

		const compressAndExportLogs = async (
			sourceDir: string,
			exportDir: string,
			logFileName: string
		): Promise<string> => {
			const timestamp = new Date().toISOString().replace(/:/g, '-');
			const outputFileName = `${logFileName.replace('.log', '')}-${timestamp}.gz`;
			const outputFilePath = path.join(exportDir, outputFileName);
			const sourceFilePath = path.join(sourceDir, logFileName);

			try {
				await compressing.gzip.compressFile(
					sourceFilePath,
					outputFilePath
				);
				logger.info(`${logFileName} successfully compressed`);
				return outputFilePath;
			} catch (error) {
				processError(error, logger);
				throw new Error(
					`Error compressing log files: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
		};

		const runCommandAndLog = (
			command: string,
			logFilePath: string
		): Promise<void> => {
			return new Promise((resolve, reject) => {
				const logStream = fs.createWriteStream(logFilePath, {
					flags: 'a'
				});
				const process = exec(
					command,
					{ maxBuffer: 1024 * 500 },
					(
						error: ExecException | null,
						stdout: string,
						stderr: string
					) => {
						if (error) {
							logStream.write(`ERROR: ${error.message}\n`);
							return reject(error);
						}
						if (stderr) {
							logStream.write(`STDERR: ${stderr}\n`);
						}
						logStream.write(stdout);
						logStream.end();
						resolve();
					}
				);

				if (process.stdout) process.stdout.pipe(logStream);
				if (process.stderr) process.stderr.pipe(logStream);
			});
		};

		const exportLogs = async (): Promise<void> => {
			const serverLogDir = path.join(
				__dirname,
				processEnv.SERVER_LOG_PATH!
			);
			const npmLogDir = path.join(
				__dirname,
				processEnv.SERVER_NPM_LOG_PATH!
			);
			const exportDir = path.join(
				__dirname,
				processEnv.BACKEND_LOGGER_EXPORT_PATH!
			);

			if (!fs.existsSync(exportDir)) {
				try {
					fs.mkdirSync(exportDir, { recursive: true });
				} catch (error) {
					processError(error, logger);
					throw new Error(
						`Error creating export directory: ${
							error instanceof Error
								? error.message
								: String(error)
						}`
					);
				}
			}

			try {
				// compress and export server logs
				const serverLogFiles = fs
					.readdirSync(serverLogDir)
					.filter(file => file.endsWith('.log'));
				for (const logFile of serverLogFiles) {
					await compressAndExportLogs(
						serverLogDir,
						exportDir,
						logFile
					);
				}

				// compress and export npm logs
				const npmLogFiles = fs
					.readdirSync(npmLogDir)
					.filter(file => file.endsWith('.logs'));
				for (const logFile of npmLogFiles) {
					await compressAndExportLogs(npmLogDir, exportDir, logFile);
				}

				logger.info(
					'Logs have been successfully compressed and exported.'
				);
			} catch (error) {
				processError(error, logger);
				throw new Error(
					`Error exporting logs: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
		};

		const cleanupLogs = async (): Promise<void> => {
			try {
				await ErrorLogger.cleanupOldLogs(sequelize, logger, 30);
				logger.info('Scheduled log cleanup completed successfully');
			} catch (error) {
				processError(error, logger);
				logger.error('Scheduld log cleanup failed');
			}
		};

		const performNpmTasks = async (): Promise<void> => {
			const npmLogDir = path.join(
				__dirname,
				processEnv.SERVER_NPM_LOG_PATH!
			);
			const timestamp = new Date().toISOString().replace(/:/g, '-');
			const logFilePath = path.join(
				npmLogDir,
				`npm-audit-update-${timestamp}.log`
			);

			try {
				logger.info('Starting npm audit...');
				await runCommandAndLog('npm audit --verbose', logFilePath);
				logger.info('npm audit completed successfully.');

				logger.info('Starting npm update...');
				await runCommandAndLog('npm update --verbose', logFilePath);
				logger.info('npm update completed successfully.');
			} catch (error) {
				processError(error, logger);
			}
		};

		const scheduleLogJobs = (): void => {
			let schedule = '';

			switch (processEnv.LOGGER) {
				case '0':
					break;
				case '1':
					schedule = '*/2 * * * *';
					exportLogs();
					break;
				case '2':
					schedule = '0 */2 * * *';
					break;
				case '3':
					schedule = '0 */6 * * *';
					break;
				case '4':
					schedule = '0 */12 * * *';
					break;
				case '5':
					schedule = '0 0 * * *';
					break;
				case '6':
					schedule = '0 0 */2 * *';
					break;
				case '7':
					schedule = '0 0 * * 0';
					break;
				default:
					schedule = '0 0 * * *';
					logger.warn(
						'LOGGER variable not set. Defaulting to nightly log export'
					);
			}

			if (schedule) {
				cron.schedule(schedule, () => {
					exportLogs().catch(error => processError(error, logger));
				});
			}

			cron.schedule('0 0 * * *', () => {
				cleanupLogs().catch(error => processError(error, logger));
			});

			cron.schedule('0 * * * *', () => {
				performNpmTasks().catch(error => processError(error, logger));
			});
		};

		scheduleLogJobs();
	} catch (error) {
		processError(error, logger);
		throw new Error(
			`Failed to create cron jobs: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}
