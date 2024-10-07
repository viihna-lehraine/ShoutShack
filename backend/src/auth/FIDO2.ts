import {
	AttestationResult,
	ExpectedAssertionResult,
	ExpectedAttestationResult,
	Fido2Lib,
	PublicKeyCredentialCreationOptions,
	PublicKeyCredentialDescriptor,
	PublicKeyCredentialRequestOptions,
	Fido2AttestationResult,
	Fido2AssertionResult,
	AssertionResult,
	UserVerification
} from 'fido2-lib';
import {
	AppLoggerServiceInterface,
	CacheServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	FIDO2ServiceInterface,
	FidoUserInterface
} from '../index/interfaces/main';
import { FidoFactor } from '../index/interfaces/types';
import { validateDependencies } from '../utils/helpers';
import { serviceTTLConfig } from '../config/cache';
import { LoggerServiceFactory } from '../index/factory/subfactories/LoggerServiceFactory';
import { ErrorHandlerServiceFactory } from '../index/factory/subfactories/ErrorHandlerServiceFactory';
import { EnvConfigServiceFactory } from '../index/factory/subfactories/EnvConfigServiceFactory';
import { CacheLayerServiceFactory } from '../index/factory/subfactories/CacheLayerServiceFactory';

import '../../types/custom/yub.d.ts';

export class FIDO2Service implements FIDO2ServiceInterface {
	private static instance: FIDO2Service | null = null;

	private FIDO2: Fido2Lib | null = null;
	private logger!: AppLoggerServiceInterface;
	private errorLogger!: ErrorLoggerServiceInterface;
	private errorHandler!: ErrorHandlerServiceInterface;
	private envConfig!: EnvConfigServiceInterface;
	private cacheService!: CacheServiceInterface;
	private timeout: number;

	private constructor() {
		this.timeout =
			(this.envConfig.getEnvVariable('fido2Timeout') as number) || 50000;
	}

	public static async getInstance(): Promise<FIDO2Service> {
		if (!FIDO2Service.instance) {
			const logger = await LoggerServiceFactory.getLoggerService();
			const errorLogger =
				await LoggerServiceFactory.getErrorLoggerService();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();
			const envConfig =
				await EnvConfigServiceFactory.getEnvConfigService();
			const cacheService =
				await CacheLayerServiceFactory.getCacheService();

			FIDO2Service.instance = new FIDO2Service();
			FIDO2Service.instance.errorLogger = errorLogger;
			FIDO2Service.instance.errorHandler = errorHandler;
			FIDO2Service.instance.envConfig = envConfig;
			FIDO2Service.instance.cacheService = cacheService;
			FIDO2Service.instance.logger = logger;
		}

		return FIDO2Service.instance;
	}

	public async initializeFIDO2Service(): Promise<void> {
		const cacheKey = 'FIDO2Lib';
		const cachedFIDO2Lib = await this.cacheService.get(cacheKey, 'auth');

		if (cachedFIDO2Lib) {
			this.FIDO2 = cachedFIDO2Lib as Fido2Lib;
			this.logger.debug('Loaded Fido2Lib from cache.');
			return;
		}

		try {
			const rpId = this.envConfig.getEnvVariable('rpId');
			const rpName = this.envConfig.getEnvVariable('rpName');
			const challengeSize =
				this.envConfig.getEnvVariable('fidoChallengeSize');
			const cryptoParams =
				this.envConfig.getEnvVariable('fidoCryptoParams');
			const requireResidentKey = this.envConfig.getEnvVariable(
				'fidoAuthRequireResidentKey'
			);
			const userVerification = this.envConfig.getEnvVariable(
				'fidoAuthUserVerification'
			);
			const validUserVerificationValues: UserVerification[] = [
				'required',
				'preferred',
				'discouraged'
			];
			const timeout = this.timeout;

			if (
				!validUserVerificationValues.includes(
					userVerification as UserVerification
				)
			) {
				throw new Error(
					'Invalid value for authenticatorUserVerification'
				);
			}

			this.FIDO2 = new Fido2Lib({
				timeout,
				rpId,
				rpName,
				challengeSize,
				cryptoParams,
				authenticatorRequireResidentKey: requireResidentKey,
				authenticatorUserVerification:
					userVerification as UserVerification
			});
			await this.cacheService.set(
				cacheKey,
				this.FIDO2,
				'auth',
				serviceTTLConfig.FIDO2 || serviceTTLConfig.default
			);

			this.logger.info('Fido2Lib initialized successfully.');
		} catch (error) {
			this.handleError('initializeFido2', error);
		}
	}

	public async ensureInitialized(): Promise<void> {
		validateDependencies(
			[{ name: 'logger', instance: this.logger }],
			this.logger
		);
		if (!this.FIDO2) {
			this.logger.debug('Fido2Lib is not initialized, initializing now.');
			await this.initializeFIDO2Service();
		} else {
			this.logger.debug('Fido2Lib is already initialized.');
		}
	}

	public async generateFIDO2RegistrationOptions(
		user: FidoUserInterface
	): Promise<PublicKeyCredentialCreationOptions> {
		const cacheKey = `FIDO2Registration:${user.id}`;
		const cachedOptions = await this.cacheService.get(cacheKey, 'auth');

		if (cachedOptions) {
			this.logger.debug('Loaded registration options from cache.');
			return cachedOptions as PublicKeyCredentialCreationOptions;
		}

		try {
			validateDependencies(
				[{ name: 'user', instance: user }],
				this.logger
			);

			await this.ensureInitialized();

			const timeout = this.timeout;
			const passkeyRegistrationOptions =
				await this.FIDO2!.attestationOptions();
			const registrationOptions: PublicKeyCredentialCreationOptions = {
				...passkeyRegistrationOptions,
				user: {
					id: Buffer.from(user.id, 'utf-8'),
					name: user.email,
					displayName: user.username
				},
				pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
				timeout,
				attestation: 'direct',
				authenticatorSelection: {
					authenticatorAttachment: 'platform',
					requireResidentKey: true,
					userVerification: 'preferred'
				}
			};

			await this.cacheService.set(
				cacheKey,
				registrationOptions,
				'auth',
				serviceTTLConfig.FIDO2Registration || serviceTTLConfig.default
			);
			this.logger.info(
				'Passkey registration options generated successfully.'
			);
			return registrationOptions;
		} catch (error) {
			this.handleError('generateRegistrationOptions', error);
			return {} as PublicKeyCredentialCreationOptions;
		}
	}

	public async verifyFIDO2Registration(
		attestation: AttestationResult,
		expectedChallenge: string
	): Promise<Fido2AttestationResult> {
		try {
			validateDependencies(
				[
					{ name: 'attestation', instance: attestation },
					{ name: 'expectedChallenge', instance: expectedChallenge }
				],
				this.logger
			);
			await this.ensureInitialized();

			const u2fAttestationExpectations: ExpectedAttestationResult = {
				challenge: expectedChallenge,
				origin: this.envConfig.getEnvVariable('rpOrigin'),
				factor: 'either' as FidoFactor,
				rpId: this.envConfig.getEnvVariable('rpId')
			};

			const result = await this.FIDO2!.attestationResult(
				attestation,
				u2fAttestationExpectations
			);
			this.logger.info('Passkey registration verified successfully.');
			return result as Fido2AttestationResult;
		} catch (error) {
			this.handleError('verifyRegistration', error);
			return {} as Fido2AttestationResult;
		}
	}

	public async generateFIDO2AuthenticationOptions(
		user: FidoUserInterface
	): Promise<PublicKeyCredentialRequestOptions> {
		const cacheKey = `FIDO2Auth:${user.id}`;
		const cachedOptions = await this.cacheService.get(cacheKey, 'auth');

		if (cachedOptions) {
			this.logger.debug('Loaded authentication options from cache.');
			return cachedOptions as PublicKeyCredentialRequestOptions;
		}

		try {
			await this.ensureInitialized();

			const userCredentials: PublicKeyCredentialDescriptor[] =
				user.credential.map(credential => ({
					type: 'public-key',
					id: Buffer.from(credential.credentialId, 'base64').buffer
				}));

			const assertionOptions = await this.FIDO2!.assertionOptions();
			const authenticationOptions: PublicKeyCredentialRequestOptions = {
				...assertionOptions,
				allowCredentials: userCredentials,
				userVerification: 'required',
				timeout: 60000
			};

			await this.cacheService.set(
				cacheKey,
				authenticationOptions,
				'auth',
				serviceTTLConfig.FIDO2Authentication || serviceTTLConfig.default
			);
			this.logger.info(
				'Passkey authentication options generated successfully.'
			);
			return authenticationOptions;
		} catch (error) {
			this.handleError('generateAuthenticationOptions', error);
			return {} as PublicKeyCredentialRequestOptions;
		}
	}

	public async verifyAuthentication(
		assertion: AssertionResult,
		expectedChallenge: string,
		publicKey: string,
		previousCounter: number,
		id: string
	): Promise<Fido2AssertionResult> {
		try {
			validateDependencies(
				[
					{ name: 'assertion', instance: assertion },
					{ name: 'expectedChallenge', instance: expectedChallenge },
					{ name: 'publicKey', instance: publicKey },
					{ name: 'previousCounter', instance: previousCounter },
					{ name: 'id', instance: id }
				],
				this.logger
			);
			await this.ensureInitialized();

			const assertionExpectations: ExpectedAssertionResult = {
				challenge: expectedChallenge,
				origin: this.envConfig.getEnvVariable('rpOrigin'),
				factor: 'either' as FidoFactor,
				publicKey,
				prevCounter: previousCounter,
				userHandle: id
			};

			const result = await this.FIDO2!.assertionResult(
				assertion,
				assertionExpectations
			);
			this.logger.info('Passkey authentication verified successfully.');
			return result as Fido2AssertionResult;
		} catch (error) {
			this.handleError('verifyAuthentication', error);
			return {} as Fido2AssertionResult;
		}
	}

	// *DEV-NOTE* use, for example, when user updates credentials
	public async invalidateFido2Cache(
		userId: string,
		action: string
	): Promise<void> {
		const cacheKeyRegistration = `FIDO2Registration:${userId}`;
		const cacheKeyAuth = `FIDO2Auth:${userId}`;

		this.logger.info(
			`Invalidating FIDO2 cache for user ${userId} due to ${action}`
		);

		try {
			await this.cacheService.del(cacheKeyRegistration, 'auth');
			await this.cacheService.del(cacheKeyAuth, 'auth');

			this.logger.info(`FIDO2 cache invalidated for user ${userId}`);
		} catch (error) {
			this.handleError('invalidateFido2Cache', error);
		}
	}

	public async shutdown(): Promise<void> {
		try {
			if (this.FIDO2) {
				this.logger.info(
					'Clearing FIDO2Lib and cache entries before shutdown...'
				);
				this.FIDO2 = null;

				await this.cacheService.del('FIDO2Lib', 'auth');
				this.logger.info(
					'FIDO2 cache and instance cleared successfully.'
				);
				FIDO2Service.instance = null;
				this.logger.info('FIDO2Service shut down successfully.');
			} else {
				this.logger.info(
					'FIDO2Service is already shut down or uninitialized.'
				);
			}
		} catch (error) {
			this.handleError('shutdown', error);
		}
	}

	private async handleError(utility: string, error: unknown): Promise<void> {
		const errorMessage = `Error in ${utility}: ${error instanceof Error ? error.message : error}`;
		this.errorLogger.logError(errorMessage);
		const utilityError =
			new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
				errorMessage,
				{
					exposeToClient: false
				}
			);
		this.errorHandler.handleError({ error: utilityError });
	}
}
