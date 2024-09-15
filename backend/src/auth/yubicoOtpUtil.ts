import { execSync } from 'child_process';
import yub from 'yub';
import getSecrets, { SecretsMap } from '../config/sops';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger.js';
import { validateDependencies } from '../utils/validateDependencies';

import '../../types/custom/yub';

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

			const utility: string = 'initializeYubicoOtpUtil()';

			secrets = await getSecrets({ logger, execSync, getDirectoryPath });

			yubClient = yub.init(
				secrets.YUBICO_CLIENT_ID.toString(),
				secrets.YUBICO_SECRET_KEY
			) as YubClient;

			logger.info(`${utility} complete}`);
		} catch (utilError) {
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to initialize Yubico OTP Utility: ${
					utilError instanceof Error ? utilError.message : utilError
				}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
		}
	}

	async function validateYubicoOTP(otp: string): Promise<boolean> {
		try {
			if (!yubClient) {
				await initializeYubicoOtpUtil();
			}

			return new Promise((resolve, reject) => {
				yubClient!.verify(
					otp,
					(utilError: Error | null, data: YubResponse) => {
						if (utilError) {
							const innerUtilError =
								new errorClasses.UtilityErrorRecoverable(
									`Failed to validate Yubico OTP: ${
										utilError instanceof Error
											? utilError.message
											: String(utilError)
									}`,
									{
										exposeToClient: false
									}
								);
							ErrorLogger.logWarning(
								innerUtilError.message,
								logger
							);
							processError(innerUtilError, logger);
							return reject(innerUtilError);
						}

						if (data && data.status === 'OK') {
							logger.debug('Yubico OTP validation successful.');
							resolve(true);
						} else {
							logger.debug('Yubico OTP validation failed.');
							resolve(false);
						}
					}
				);
			});
		} catch (utilError) {
			const utility: string = 'validateYubicoOTP()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to validate Yubico OTP in ${utility}: ${
					utilError instanceof Error ? utilError.message : utilError
				}`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
			return false;
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
		} catch (utiLError) {
			const utility: string = 'generateYubicoOtpOptions()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Failed to generate Yubico OTP options in ${utility}: ${
					utiLError instanceof Error ? utiLError.message : utiLError
				} ; Returning object with placeholder values in lieu of complted YubicoOtpOptions object`,
				{
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(utilityError.message, logger);
			processError(utilityError, logger);
			return {
				clientId: 0,
				apiKey: '',
				apiUrl: ''
			};
		}
	}

	return {
		initializeYubicoOtpUtil,
		validateYubicoOTP,
		generateYubicoOtpOptions
	};
}
