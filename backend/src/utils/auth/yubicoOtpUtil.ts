import yub from 'yub';
import '../../../types/custom/yub.d.ts';
import getSecrets, { SecretsMap } from '../sops.js';
import { execSync } from 'child_process';
import { Logger } from '../../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../../middleware/errorHandler';

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
	let secrets: SecretsMap | null = null;
	let yubClient: YubClient | undefined;

	validateDependencies(
		[
			{ name: 'yub', instance: yub },
			{ name: 'getSecrets', instance: getSecrets },
			{ name: 'logger', instance: logger },
			{ name: 'execSync', instance: execSync },
			{ name: 'getDirectoryPath', instance: getDirectoryPath }
		],
		logger
	);

	async function initializeYubicoOtpUtil(): Promise<void> {
		try {
			logger.info('Initializing Yubico OTP Utility.');
			secrets = await getSecrets({ logger, execSync, getDirectoryPath });

			if (!secrets) {
				throw new Error('Secrets could not be loaded');
			}

			yubClient = yub.init(
				secrets.YUBICO_CLIENT_ID.toString(),
				secrets.YUBICO_SECRET_KEY
			) as YubClient;

			logger.info('Yubico OTP Utility initialized successfully.');
		} catch (error) {
			handleGeneralError(error, logger);
			throw new Error(
				`Failed to initialize Yubico OTP Utility: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	async function validateYubicoOTP(otp: string): Promise<boolean> {
		try {
			if (!yubClient) {
				logger.warn('Yubico client not initialized, initializing now.');
				await initializeYubicoOtpUtil();
			}

			return new Promise((resolve, reject) => {
				yubClient!.verify(
					otp,
					(error: Error | null, data: YubResponse) => {
						if (error) {
							handleGeneralError(error, logger);
							return reject(error);
						}

						if (data && data.status === 'OK') {
							logger.info('Yubico OTP validation successful.');
							resolve(true);
						} else {
							logger.info('Yubico OTP validation failed.');
							resolve(false);
						}
					}
				);
			});
		} catch (error) {
			handleGeneralError(error, logger);
			throw new Error(
				`Failed to validate Yubico OTP: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	function generateYubicoOtpOptions(): YubicoOtpOptions {
		try {
			if (!secrets) {
				throw new Error('Secrets have not been initialized');
			}

			logger.info('Generating Yubico OTP options.');
			return {
				clientId: secrets.YUBICO_CLIENT_ID as number,
				apiKey: secrets.YUBICO_SECRET_KEY as string,
				apiUrl: secrets.YUBICO_API_URL as string
			};
		} catch (error) {
			handleGeneralError(error, logger);
			throw new Error(
				`Failed to generate Yubico OTP options: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	return {
		initializeYubicoOtpUtil,
		validateYubicoOTP,
		generateYubicoOtpOptions
	};
}
