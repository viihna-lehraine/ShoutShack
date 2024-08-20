import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import compressing from 'compressing';
import { exec } from 'child_process';
import { __dirname } from '../index';
import setupLogger from '../middleware/logger';

const compressAndExportLogs = async (
	sourceDir: string,
	exportDir: string,
	logFileName: string
) => {
	const logger = await setupLogger();
	const timestamp = new Date().toISOString().replace(/:/g, '-');
	const outputFileName = `${logFileName.replace('.log', '')}-${timestamp}.gz`;
	const outputFilePath = path.join(exportDir, outputFileName);
	const sourceFilePath = path.join(sourceDir, logFileName);

	try {
		await compressing.gzip.compressFile(sourceFilePath, outputFilePath);
		logger.info(`${logFileName} successfully compressed`);
		return outputFilePath;
	} catch (err) {
		const error = err as Error;
		logger.error(`Unable to compress ${logFileName}: ${error.message}`);
		throw new Error(`Error compessing log files: ${error.message}`);
	}
};

const runCommandAndLog = (
	command: string,
	logFilePath: string
): Promise<void> => {
	return new Promise((resolve, reject) => {
		const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
		const process = exec(
			command,
			{ maxBuffer: 1024 * 500 },
			(error, stdout, stderr) => {
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

		process.stdout!.pipe(logStream);
		process.stderr!.pipe(logStream);
	});
};

const exportLogs = async () => {
	const logger = await setupLogger();
	const serverLogDir = path.join(__dirname, process.env.SERVER_LOG_PATH!);
	const npmLogDir = path.join(__dirname, process.env.SERVER_NPM_LOG_PATH!);
	const exportDir = path.join(
		__dirname,
		process.env.BACKEND_LOGGER_EXPORT_PATH!
	);

	// Ensure the export directory exists
	if (!fs.existsSync(exportDir)) {
		fs.mkdirSync(exportDir, { recursive: true });
	}

	try {
		// compress and export server logs
		const serverLogFiles = fs
			.readdirSync(serverLogDir)
			.filter((file) => file.endsWith('.log'));
		for (const logFile of serverLogFiles) {
			await compressAndExportLogs(serverLogDir, exportDir, logFile);
		}

		// Compress and export npm logs
		const npmLogFiles = fs
			.readdirSync(npmLogDir)
			.filter((file) => file.endsWith('.logs'));
		for (const logFile of npmLogFiles) {
			await compressAndExportLogs(npmLogDir, exportDir, logFile);
		}

		logger.info('Logs have been successfully compresseed and exported.');
	} catch (err) {
		const error = err as Error;
		logger.error(`Error exporting logs: ${error.message}`);
	}
};

// Perform hourly npm audit and update
const performNpmTasks = async () => {
	const logger = await setupLogger();
	const npmLogDir = path.join(__dirname, process.env.SERVER_NPM_LOG_PATH!);
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
	} catch (err) {
		const error = err as Error;
		logger.error(`Error during npm tasks: ${error.message}`);
	}
};

// Determine the cron schedule based on LOGGER environment
const scheduleLogJobs = async () => {
	const logger = await setupLogger();

	let schedule = '';

	switch (process.env.LOGGER) {
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
			schedule: '0 0 * * *';
			logger.warn(
				'LOGGER variable not set. Defaulting to nightly log export'
			);
	}

	cron.schedule(schedule, exportLogs);
	cron.schedule('0 * * * *', performNpmTasks);
};

scheduleLogJobs();
