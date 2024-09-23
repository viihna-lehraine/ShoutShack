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

const logDirectory = process.env.APP_INIT_LOGS_PATH;

if (logDirectory) {
	if (!fs.existsSync(logDirectory)) {
		fs.mkdirSync(logDirectory, { recursive: true });
	}
} else {
	console.error(
		'Log directory is undefined. Please check the environment variable APP_INIT_LOGS_PATH.'
	);

	process.exit(1);
}

const startupLogger = createLogger({
	format: format.combine(format.timestamp(), format.json()),
	transports: [
		new DailyRotateFile({
			filename: path.join(logDirectory, 'adminLoginAttempts-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			maxSize: '20m',
			maxFiles: '30d',
			zippedArchive: true
		})
	]
});

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function getSystemDetails(): {
	ipv4?: string;
	ipv6?: string;
	hostname: string;
	platform: string;
	cpuArch: string;
} {
	const interfaces = os.networkInterfaces();
	let ipv4: string | undefined;
	let ipv6: string | undefined;

	for (const name of Object.keys(interfaces)) {
		for (const net of interfaces[name] || []) {
			if (net.family === 'IPv4' && !net.internal && !ipv4) {
				ipv4 = net.address;
			}
			if (net.family === 'IPv6' && !net.internal && !ipv6) {
				ipv6 = net.address;
			}
		}
	}

	const hostname = os.hostname();
	const platform = os.platform();
	const cpuArch = os.arch();

	const result: {
		ipv4?: string;
		ipv6?: string;
		hostname: string;
		platform: string;
		cpuArch: string;
	} = {
		hostname,
		platform: platform as string,
		cpuArch
	};

	if (ipv4 !== undefined) result.ipv4 = ipv4;
	if (ipv6 !== undefined) result.ipv6 = ipv6;

	return result;
}

async function promptCredentials(): Promise<{
	username: string;
	password: string;
}> {
	const username = await new Promise<string>(resolve => {
		rl.question('Enter Admin Username: ', resolve);
	});

	const password = await new Promise<string>(resolve => {
		let input = '';
		readline.emitKeypressEvents(process.stdin);
		process.stdin.setRawMode(true);

		process.stdin.on('keypress', (str, key) => {
			if (key.name === 'return') {
				process.stdin.setRawMode(false);
				rl.write('\n');
				process.stdin.removeAllListeners('keypress');
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
	return new Promise<string>(resolve => {
		rl.question(promptMessage, secret => {
			process.stdout.write('\n');
			resolve(secret);
		});
	});
}

function getAdminCredentials(): {
	usernameToPasswordMap: { [key: string]: string | undefined };
	usernameToAdminIdMap: { [key: string]: string | undefined };
} {
	const usernameToPasswordMap: { [key: string]: string | undefined } = {};
	const usernameToAdminIdMap: { [key: string]: string | undefined } = {};

	Object.keys(process.env).forEach(key => {
		if (key.startsWith('ADMIN_USERNAME_')) {
			const adminNumber = key.split('_')[2];
			const associatedPasswordKey = `ADMIN_PASSWORD_${adminNumber}`;
			const associatedAdminIdKey = `ADMIN_ID_${adminNumber}`;

			if (process.env[key] && process.env[associatedPasswordKey]) {
				usernameToPasswordMap[process.env[key] as string] =
					process.env[associatedPasswordKey];
				usernameToAdminIdMap[process.env[key] as string] =
					process.env[associatedAdminIdKey];
			}
		}
	});

	return {
		usernameToPasswordMap,
		usernameToAdminIdMap
	};
}

async function validateCredentials(
	username: string,
	password: string,
	adminCredentials: { [key: string]: string | undefined }
): Promise<boolean> {
	const storedHashedPassword = adminCredentials[username];

	if (!storedHashedPassword) {
		console.error('Invalid admin username.');
		return false;
	}

	return argon2.verify(storedHashedPassword, password);
}

async function validateAdminSecret(
	key: string,
	prefix: string
): Promise<boolean> {
	const allowedKeys: string[] = Object.keys(process.env)
		.filter(envKey => envKey.startsWith(prefix))
		.map(envKey => process.env[envKey] as string);

	for (const hashedKey of allowedKeys) {
		if (hashedKey && (await argon2.verify(hashedKey, key))) {
			return true;
		}
	}

	return false;
}

async function logAttempt(
	success: boolean,
	attempts: number,
	username: string | undefined,
	eventType: string
): Promise<void> {
	const timestamp = new Date().toISOString();
	const systemDetails = getSystemDetails();
	const loginData = {
		timestamp,
		username: username || 'Unknown',
		success,
		attempts,
		eventType,
		systemUser: os.userInfo().username,
		...systemDetails
	};
	startupLogger.info(loginData);
}

export async function login(): Promise<{
	encryptionKey: string | null;
	gpgPassphrase: string | null;
	adminId: number | null;
}> {
	let retries = 3;
	let attempts = 0;
	let rawAdminId: string | null = null;
	let rawEncryptionKey: string | null = null;
	let rawGPGPassphrase: string | null = null;

	const { usernameToPasswordMap, usernameToAdminIdMap } =
		getAdminCredentials();

	if (Object.keys(usernameToPasswordMap).length === 0) {
		console.error('No admin credentials found.\nShutting down...');
		process.exit(1);
	}

	while (retries > 0) {
		try {
			const { username, password } = await promptCredentials();
			const valid = await validateCredentials(
				username,
				password,
				usernameToPasswordMap
			);
			attempts++;

			if (valid) {
				rawAdminId = usernameToAdminIdMap[username] || null;

				if (!rawAdminId) {
					console.error('Admin ID not found.');
					process.exit(1);
				}

				for (let keyAttempts = 0; keyAttempts < 3; keyAttempts++) {
					const encryptionKey = await promptAdminSecret(
						'Enter Encryption Key: '
					);
					const keyValid = await validateAdminSecret(
						encryptionKey,
						'ENCRYPTION_KEY_'
					);

					if (keyValid) {
						console.log('Encryption key validated successfully.');
						rawEncryptionKey = encryptionKey;
						await logAttempt(
							true,
							attempts,
							username,
							'encryption-key-validation'
						);

						for (
							let passphraseAttempts = 0;
							passphraseAttempts < 3;
							passphraseAttempts++
						) {
							const passphrase = await promptAdminSecret(
								'Enter GPG Passphrase: '
							);
							const passphraseValid = await validateAdminSecret(
								passphrase,
								'GPG_PASSPHRASE_'
							);

							if (passphraseValid) {
								console.log(
									'GPG Passphrase validated successfully.'
								);
								rawGPGPassphrase = passphrase;
								await logAttempt(
									true,
									passphraseAttempts,
									username,
									'gpg-passphrase-validation'
								);
								rl.close();

								const adminId = parseInt(rawAdminId, 10);

								return {
									encryptionKey: rawEncryptionKey,
									gpgPassphrase: rawGPGPassphrase,
									adminId
								};
							} else {
								console.log(
									'Invalid GPG passphrase. Please try again.'
								);
							}
						}

						console.error(
							'Maximum GPG passphrase retries reached.\nShutting down...'
						);
						process.exit(1);
					} else {
						console.log(
							'Invalid encryption key. Please try again.'
						);
					}
				}

				console.error(
					'Maximum encryption key retries reached.\nShutting down...'
				);
				process.exit(1);
			} else {
				console.log('Invalid credentials. Please try again.');
				retries--;
				await logAttempt(false, attempts, username, 'login');
			}
		} catch (error) {
			console.error(`Error occurred during login:\n${error}`);
			process.exit(1);
		}
	}

	console.error('Maximum retries reached.\nShutting down...');
	process.exit(1);
}