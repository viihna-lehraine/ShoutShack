import yub from 'yub';
import getSecrets from '../../config/secrets';
import '../../../types/custom/yub.d.ts';

interface Secrets {
	YUBICO_CLIENT_ID: number;
	YUBICO_SECRET_KEY: string;
	YUBICO_API_URL: string;
}

interface YubClient {
	verify(
		otp: string,
		callback: (err: Error | null, data: YubResponse) => void
	): void;
}

interface YubResponse {
	status: string;
	[key: string]: string | number | boolean | object | null | undefined; // *DEV-NOTE* I have absolutely no idea what type should be
}

interface YubicoOtpOptions {
	clientId: number;
	apiKey: string;
	apiUrl: string;
}

const secrets: Secrets = await getSecrets();
let yubClient: YubClient | undefined;

async function initializeYubicoOtpUtil(): Promise<void> {
	yubClient = yub.init(
		secrets!.YUBICO_CLIENT_ID.toString(),
		secrets!.YUBICO_SECRET_KEY
	) as YubClient;
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
function generateYubicoOtpOptions(): YubicoOtpOptions {
	if (!secrets) {
		throw new Error('Secrets have not been initialized');
	}

	return {
		clientId: secrets.YUBICO_CLIENT_ID,
		apiKey: secrets.YUBICO_SECRET_KEY,
		apiUrl: secrets.YUBICO_API_URL
	};
}

export { generateYubicoOtpOptions, validateYubicoOTP };
