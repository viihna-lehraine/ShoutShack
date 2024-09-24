import { envSecretsStore } from '../environment/envSecrets';
import {
	YubClientInterface,
	YubicoOtpMFAInterface,
	YubicoOtpOptionsInterface,
	YubResponseInterface
} from '../index/interfaces';
import { configService } from '../services/configService';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';

export default function createYubicoOtpUtil({ yub }: YubicoOtpMFAInterface): {
	initializeYubicoOtpUtil: () => Promise<void>;
	validateYubicoOTP: (otp: string) => Promise<boolean>;
	generateYubicoOtpOptions: () => Promise<YubicoOtpOptionsInterface>;
} {
	const logger = configService.getAppLogger();
	const errorLogger = configService.getErrorLogger();

	let yubClient: YubClientInterface | undefined;

	validateDependencies([{ name: 'yub', instance: yub }], logger);

	async function initializeYubicoOtpUtil(): Promise<void> {
		try {
			logger.info('Initializing Yubico OTP Utility.');

			const secrets = envSecretsStore.retrieveSecrets([
				'YUBICO_CLIENT_ID',
				'YUBICO_SECRET_KEY'
			]);

			if (
				secrets &&
				typeof secrets === 'object' &&
				!Array.isArray(secrets)
			) {
				const yubicoClientId =
					secrets['YUBICO_CLIENT_ID']?.toString() || '';
				const yubicoSecretKey = secrets['YUBICO_SECRET_KEY'] || '';

				if (!yubicoClientId || !yubicoSecretKey) {
					throw new Error(
						'Yubico Client ID or Secret Key is missing'
					);
				}

				yubClient = yub.init(
					yubicoClientId,
					yubicoSecretKey
				) as YubClientInterface;

				logger.info('Yubico OTP Utility successfully initialized.');
			} else {
				throw new Error('Failed to retrieve Yubico secrets');
			}
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to initialize Yubico OTP Utility: ${
						utilError instanceof Error
							? utilError.message
							: utilError
					}`,
					{ exposeToClient: false }
				);
			errorLogger.logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
		} finally {
			try {
				await envSecretsStore.reEncryptSecrets([
					'YUBICO_CLIENT_ID',
					'YUBICO_SECRET_KEY'
				]);
				logger.debug('Secrets re-encrypted');
			} catch (reEncryptError) {
				errorLogger.logError(
					`Failed to re-encrypt secrets: ${reEncryptError}`
				);
			}
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
					(utilError: Error | null, data: YubResponseInterface) => {
						if (utilError) {
							const innerUtilError =
								new errorHandler.ErrorClasses.UtilityErrorRecoverable(
									`Failed to validate Yubico OTP: ${
										utilError instanceof Error
											? utilError.message
											: String(utilError)
									}`,
									{ exposeToClient: false }
								);
							errorLogger.logWarn(innerUtilError.message);
							errorHandler.handleError({ error: innerUtilError });
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
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to validate Yubico OTP in ${utility}: ${
						utilError instanceof Error
							? utilError.message
							: utilError
					}`,
					{ exposeToClient: false }
				);
			errorLogger.logWarn(utilityError.message);
			errorHandler.handleError({ error: utilityError });
			return false;
		}
	}

	async function generateYubicoOtpOptions(): Promise<YubicoOtpOptionsInterface> {
		try {
			logger.info('Generating Yubico OTP options.');

			const apiUrl = configService.getEnvVariables().yubicoApiUrl;

			const { YUBICO_CLIENT_ID, YUBICO_SECRET_KEY } =
				envSecretsStore.retrieveSecrets([
					'YUBICO_CLIENT_ID',
					'YUBICO_SECRET_KEY'
				]) as Record<string, string>;

			if (!YUBICO_CLIENT_ID || !YUBICO_SECRET_KEY) {
				throw new Error(
					'Failed to retrieve or decrypt Yubico client ID or secret key'
				);
			}

			return {
				clientId: parseInt(YUBICO_CLIENT_ID, 10),
				apiKey: YUBICO_SECRET_KEY,
				apiUrl
			};
		} catch (utiLError) {
			const utility: string = 'generateYubicoOtpOptions()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate Yubico OTP options in ${utility}: ${
						utiLError instanceof Error
							? utiLError.message
							: utiLError
					}; Returning object with placeholder values in lieu of completed YubicoOtpOptions object`,
					{ exposeToClient: false }
				);

			errorLogger.logWarn(utilityError.message);
			errorHandler.handleCriticalError({ error: utilityError });

			return {
				clientId: 0,
				apiKey: '',
				apiUrl: ''
			};
		} finally {
			try {
				await envSecretsStore.reEncryptSecrets([
					'YUBICO_CLIENT_ID',
					'YUBICO_SECRET_KEY'
				]);
				logger.debug('Secrets re-encrypted');
			} catch (reEncryptError) {
				errorLogger.logError(
					`Failed to re-encrypt secrets: ${reEncryptError}`
				);
			}
		}
	}

	return {
		initializeYubicoOtpUtil,
		validateYubicoOTP,
		generateYubicoOtpOptions
	};
}
