import yub from 'yub';
import getSecrets from '../../config/secrets.js';

interface Secrets {
	YUBICO_CLIENT_ID: number;
	YUBICO_SECRET_KEY: string;
	YUBICO_API_URL: string;
}

interface YubClient {
	verify(otp: string, callback: (err: Error | null, data: YubResponse) => void): void;
}

interface YubResponse {
	status: string;
	[key: string]: any;
}

let secrets: Secrets | undefined;
let yubClient: YubClient | undefined;

async function initializeYubicoOtpUtil(): Promise<void> {
	if (!secrets || !yubClient) {
		secrets = await getSecrets();
		yubClient = yub.init(secrets!.YUBICO_CLIENT_ID.toString(), secrets!.YUBICO_SECRET_KEY) as YubClient;
	}
}

// for validating a Yubico OTP
async function validateYubicoOTP(otp: string): Promise<boolean> {
	if (!yubClient) {
		await initializeYubicoOtpUtil();
	}

	return new Promise((resolve, reject) => {
		yubClient!.verify(otp, (err: Error | null, data: YubResponse) => {
			if (err) {
				return reject(err);
			}

			if (data && data.status === 'OK') {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
}

// generated OTP configruation options
function generateYubicoOtpOptions() {
	if (!secrets) {
		throw new Error('Secrets have not been initialized');
	}

	return {
		clientId: secrets.YUBICO_CLIENT_ID,
		apiKey: secrets.YUBICO_SECRET_KEY,
		apiUrl: secrets.YUBICO_API_URL,
	};
}

export { generateYubicoOtpOptions, validateYubicoOTP };
