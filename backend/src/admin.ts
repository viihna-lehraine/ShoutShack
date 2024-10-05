import argon2 from 'argon2';
import { config } from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { stdout as output } from 'process';
import readline from 'readline';
import { createLogger, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

config({ path: path.resolve(__dirname, '../config/env/backend.startup.env') });

function setupLogging(): ReturnType<typeof createLogger> {
	const logDirectory = process.env.APP_INIT_LOGS_PATH;

	if (logDirectory) {
		if (!fs.existsSync(logDirectory)) {
			fs.mkdirSync(logDirectory, { recursive: true });
		}
	} else {
		handleFatalError(
			'Log directory is undefined. Please check APP_INIT_LOGS_PATH.'
		);
	}

	return createLogger({
		format: format.combine(format.timestamp(), format.json()),
		transports: [
			new DailyRotateFile({
				filename: path.join(
					logDirectory!,
					'adminLoginAttempts-%DATE%.log'
				),
				datePattern: 'YYYY-MM-DD',
				maxSize: '20m',
				maxFiles: '30d',
				zippedArchive: true
			})
		]
	});
}

const startupLogger = setupLogging();

function getSystemDetails(): Record<string, string> {
	const interfaces = os.networkInterfaces();
	let ipv4: string | undefined;
	let ipv6: string | undefined;

	for (const name of Object.keys(interfaces)) {
		for (const net of interfaces[name] || []) {
			if (net.family === 'IPv4' && !net.internal && !ipv4)
				ipv4 = net.address;
			if (net.family === 'IPv6' && !net.internal && !ipv6)
				ipv6 = net.address;
		}
	}

	return {
		hostname: os.hostname(),
		platform: os.platform(),
		cpuArch: os.arch(),
		ipv4: ipv4 || 'N/A',
		ipv6: ipv6 || 'N/A'
	};
}

function handleFatalError(message: string): void {
	console.error(`${message}\nShutting down...`);
	process.exit(1);
}

async function promptCredentials(): Promise<{
	username: string;
	password: string;
}> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	const username = await new Promise<string>(resolve =>
		rl.question('Enter Admin Username: ', resolve)
	);

	const password = await new Promise<string>(resolve => {
		let input = '';
		readline.emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);

		process.stdin.on('keypress', (str, key) => {
			if (key.name === 'return') {
				process.stdin.setRawMode(false);
				rl.write('\n');
				process.stdin.removeAllListeners('keypress');
				rl.close();
				resolve(input);
			} else if (key.name === 'backspace') {
				if (input.length > 0) {
					input = input.slice(0, -1);
					output.write('\b \b');
				}
			} else {
				input += str;
				output.write('*');
			}
		});
	});

	return { username, password };
}

async function promptAdminSecret(promptMessage: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	const secret = await new Promise<string>(resolve =>
		rl.question(promptMessage, resolve)
	);
	rl.close();
	return secret;
}

function getAdminCredentials(): {
	usernameToPasswordMap: Record<string, string | undefined>;
	usernameToAdminIdMap: Record<string, string | undefined>;
} {
	const usernameToPasswordMap: Record<string, string | undefined> = {};
	const usernameToAdminIdMap: Record<string, string | undefined> = {};

	for (const key of Object.keys(process.env)) {
		if (key.startsWith('ADMIN_USERNAME_')) {
			const adminIndex = key.split('_')[2];
			usernameToPasswordMap[process.env[key]!] =
				process.env[`ADMIN_PASSWORD_${adminIndex}`];
			usernameToAdminIdMap[process.env[key]!] =
				process.env[`ADMIN_ID_${adminIndex}`];
		}
	}

	return { usernameToPasswordMap, usernameToAdminIdMap };
}

async function validateCredentials(
	username: string,
	password: string,
	adminCredentials: Record<string, string | undefined>
): Promise<boolean> {
	const storedHashedPassword = adminCredentials[username];
	return storedHashedPassword
		? argon2.verify(storedHashedPassword, password)
		: false;
}

async function validateAdminSecret(
	key: string,
	prefix: string
): Promise<boolean> {
	const allowedKeys = Object.keys(process.env)
		.filter(envKey => envKey.startsWith(prefix))
		.map(envKey => process.env[envKey]!);

	return Promise.any(
		allowedKeys.map(hashedKey => argon2.verify(hashedKey, key))
	)
		.then(() => true)
		.catch(() => false);
}

async function logAttempt(
	success: boolean,
	username: string | undefined,
	eventType: string
): Promise<void> {
	startupLogger.info({
		timestamp: new Date().toISOString(),
		username: username || 'Unknown',
		success,
		eventType,
		systemUser: os.userInfo().username,
		...getSystemDetails()
	});
}

export async function login(): Promise<{
	encryptionKey: string | null;
	gpgPassphrase: string | null;
	adminId: number | null;
}> {
	let retries = 3;

	console.log(
		'Welcome to the application Admin Login. Please enter your credentials.'
	);

	const { usernameToPasswordMap, usernameToAdminIdMap } =
		getAdminCredentials();
	if (!Object.keys(usernameToPasswordMap).length)
		handleFatalError('No admin credentials found.');

	while (retries > 0) {
		const { username, password } = await promptCredentials();
		const valid = await validateCredentials(
			username,
			password,
			usernameToPasswordMap
		);

		if (valid) {
			const adminId = usernameToAdminIdMap[username];
			if (!adminId) {
				handleFatalError('Admin ID not found.');
				return {
					encryptionKey: null,
					gpgPassphrase: null,
					adminId: null
				};
			}

			const encryptionKey = await handleSecretValidation(
				'Enter Encryption Key: ',
				'ENCRYPTION_KEY_'
			);
			const gpgPassphrase = await handleSecretValidation(
				'Enter GPG Passphrase: ',
				'GPG_PASSPHRASE_'
			);

			return {
				encryptionKey,
				gpgPassphrase,
				adminId: parseInt(adminId, 10)
			};
		} else {
			retries--;
			console.log(`Invalid credentials. Attempts left: ${retries}`);
			await logAttempt(false, username, 'login');
		}
	}

	handleFatalError('Maximum retries reached.');

	return { encryptionKey: null, gpgPassphrase: null, adminId: null };
}

async function handleSecretValidation(
	promptMessage: string,
	prefix: string
): Promise<string> {
	for (let attempts = 0; attempts < 3; attempts++) {
		const secret = await promptAdminSecret(promptMessage);
		if (await validateAdminSecret(secret, prefix)) {
			await logAttempt(
				true,
				undefined,
				`${prefix.toLowerCase()}-validation`
			);
			return secret;
		} else {
			console.log(`Invalid ${promptMessage.trim()}. Please try again.`);
		}
	}

	handleFatalError(`Maximum ${promptMessage.trim()} retries reached.`);
	return '';
}
