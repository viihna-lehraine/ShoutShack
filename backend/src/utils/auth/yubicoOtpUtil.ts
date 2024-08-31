import yub from 'yub';
import '../../../types/custom/yub.d.ts';
import getSecrets from '../../config/sops';
import { execSync } from 'child_process';
import { Logger } from 'winston';

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
	[key: string]: string | number | boolean | object | null | undefined;
}

interface YubicoOtpOptions {
	clientId: number;
	apiKey: string;
	apiUrl: string;
}

interface YubicoUtilDependencies {
	yub: typeof yub;
	getSecrets: typeof getSecrets.getSecrets;
	logger: Logger;
	execSync: typeof execSync;
	getDirectoryPath: () => string;
}

export default function createYubicoOtpUtil({
	yub,
	getSecrets,
	logger,
	execSync,
	getDirectoryPath
}: YubicoUtilDependencies): {
	initializeYubicoOtpUtil: () => Promise<void>;
	validateYubicoOTP: (otp: string) => Promise<boolean>;
	generateYubicoOtpOptions: () => YubicoOtpOptions;
} {
	let secrets: Secrets;
	let yubClient: YubClient | undefined;

	async function initializeYubicoOtpUtil(): Promise<void> {
		secrets = await getSecrets({ logger, execSync, getDirectoryPath });
		yubClient = yub.init(
			secrets.YUBICO_CLIENT_ID.toString(),
			secrets.YUBICO_SECRET_KEY
		) as YubClient;
	}

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

	return {
		initializeYubicoOtpUtil,
		validateYubicoOTP,
		generateYubicoOtpOptions
	};
}
