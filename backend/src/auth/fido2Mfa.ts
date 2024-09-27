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
import { errorHandler } from '../services/errorHandler';
import {
	AppLoggerServiceInterface,
	FidoUserInterface,
	SecretsMap
} from '../index/interfaces';
import { FidoFactor } from '../index/types';
import { validateDependencies } from '../utils/helpers';
import { ServiceFactory } from '../index/factory';

import '../../types/custom/yub.js';

const configService = ServiceFactory.getConfigService();
const logger = ServiceFactory.getLoggerService() as AppLoggerServiceInterface;
let fido2: Fido2Lib | null = null;
let secrets: SecretsMap;

export async function initializeFido2(): Promise<void> {
	try {
		const rpId = configService.getEnvVariable('rpId');
		const rpName = configService.getEnvVariable('rpName');
		const challengeSize = configService.getEnvVariable('fidoChallengeSize');
		const cryptoParams = configService.getEnvVariable('fidoCryptoParams');
		const requireResidentKey = configService.getEnvVariable(
			'fidoAuthRequireResidentKey'
		);
		const userVerification = configService.getEnvVariable(
			'fidoAuthUserVerification'
		);

		if (typeof rpId !== 'string' || typeof rpName !== 'string') {
			throw new Error(
				'Environment variables rpId and rpName must be strings'
			);
		}

		if (typeof challengeSize !== 'number') {
			throw new Error(
				'Environment variable fidochallengeSize must be a number'
			);
		}

		if (
			!Array.isArray(cryptoParams) ||
			typeof requireResidentKey !== 'boolean' ||
			typeof userVerification !== 'string'
		) {
			throw new Error(
				'Invalid environment variables for FIDO2 configuration'
			);
		}

		const validUserVerificationValues: UserVerification[] = [
			'required',
			'preferred',
			'discouraged'
		];

		if (
			!validUserVerificationValues.includes(
				userVerification as UserVerification
			)
		) {
			throw new Error('Invalid value for authenticatorUserVerification');
		}

		fido2 = new Fido2Lib({
			timeout: 60000,
			rpId,
			rpName,
			challengeSize,
			cryptoParams,
			authenticatorRequireResidentKey: requireResidentKey,
			authenticatorUserVerification: userVerification as UserVerification
		});

		logger.info('Fido2Lib initialized successfully.');
	} catch (utilErrr) {
		const utility: string = 'initializeFido2()';
		const utilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Failed to initialize ${utility}: ${utilErrr instanceof Error ? utilErrr.message : utilErrr}`,
				{ exposeToClient: false }
			);
		configService.getErrorLogger().logError(utilityError.message);
		errorHandler.handleError({ error: utilityError });
	}
}

export async function ensureFido2Initialized(): Promise<void> {
	validateDependencies([{ name: 'logger', instance: logger }], logger);
	if (!fido2) {
		logger.debug('Fido2Lib is not initialized, initializing now.');
		await initializeFido2();
	} else {
		logger.debug('Fido2Lib is already initialized.');
		return;
	}
}

export async function generatePasskeyRegistrationOptions(
	user: FidoUserInterface
): Promise<PublicKeyCredentialCreationOptions> {
	try {
		validateDependencies([{ name: 'user', instance: user }], logger);

		await ensureFido2Initialized();

		const passkeyRegistrationOptions = await fido2!.attestationOptions();

		const registrationOptions: PublicKeyCredentialCreationOptions = {
			...passkeyRegistrationOptions,
			user: {
				id: Buffer.from(user.id, 'utf-8'),
				name: user.email,
				displayName: user.username
			},
			pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
			timeout: 60000,
			attestation: 'direct',
			authenticatorSelection: {
				authenticatorAttachment: 'platform',
				requireResidentKey: true,
				userVerification: 'preferred'
			}
		};
		logger.info('Passkey registration options generated successfully.');
		return registrationOptions;
	} catch (utilError) {
		const utility: string = 'generatePasskeyRegistrationOptions()';
		const utilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured with ${utility}. Failed to generate passkey registration options: ${utilError instanceof Error ? utilError.message : utilError}`,
				{ exposeToClient: false }
			);
		configService
			.getErrorLogger()
			.logWarn(
				`Error occured with ${utility}. Failed to generate passkey registration options: ${utilError instanceof Error ? utilError.message : utilError} ; Returning PublicKeyCredentialCreationOptions as an empty object`
			);
		errorHandler.handleError({ error: utilityError });
		return {} as PublicKeyCredentialCreationOptions;
	}
}

export async function verifyPasskeyRegistration(
	attestation: AttestationResult,
	expectedChallenge: string
): Promise<Fido2AttestationResult> {
	try {
		validateDependencies(
			[
				{ name: 'attestation', instance: attestation },
				{ name: 'expectedChallenge', instance: expectedChallenge }
			],
			logger
		);

		await ensureFido2Initialized();

		const u2fAttestationExpectations: ExpectedAttestationResult = {
			challenge: expectedChallenge,
			origin: secrets.RP_ORIGIN as string,
			factor: 'either' as FidoFactor,
			rpId: secrets.RP_ID
		};

		const result = (await fido2!.attestationResult(
			attestation,
			u2fAttestationExpectations
		)) as Fido2AttestationResult;

		logger.info('Passkey registration verified successfully.');
		return result;
	} catch (utilError) {
		const utility: string = 'verifyPasskeyRegistration()';
		const utilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured with ${utility}. Failed to verify passkey registration: ${utilError instanceof Error ? utilError.message : utilError} ; Returning Fido2AttestationResult as an empty object`,
				{ exposeToClient: false }
			);
		configService.getErrorLogger().logError(utilityError.message);
		errorHandler.handleError({ error: utilityError });
		return {} as Fido2AttestationResult;
	}
}

export async function generatePasskeyAuthenticationOptions(
	user: FidoUserInterface
): Promise<PublicKeyCredentialRequestOptions> {
	try {
		await ensureFido2Initialized();

		const userCredentials: PublicKeyCredentialDescriptor[] =
			user.credential.map(credential => ({
				type: 'public-key' as const,
				id: Buffer.from(credential.credentialId, 'base64').buffer
			}));

		const assertionOptions = await fido2!.assertionOptions();

		const authenticationOptions: PublicKeyCredentialRequestOptions = {
			...assertionOptions,
			allowCredentials: userCredentials,
			userVerification: 'required', // ensure passwordless login
			timeout: 60000
		};

		logger.info('Passkey authentication options generated successfully.');
		return authenticationOptions;
	} catch (utilError) {
		const utility: string = 'generatePasskeyAuthenticationOptions()';
		const utilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured with ${utility}. Failed to generate passkey authentication options: ${utilError instanceof Error ? utilError.message : utilError} ; Returning PublicKeyCredentialRequestOptions as an empty object`,
				{ exposeToClient: false }
			);
		configService.getErrorLogger().logError(utilityError.message);
		errorHandler.handleError({ error: utilityError });
		return {} as PublicKeyCredentialRequestOptions;
	}
}

export async function verifyPasskeyAuthentication(
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
			logger
		);

		await ensureFido2Initialized();

		const assertionExpectations: ExpectedAssertionResult = {
			challenge: expectedChallenge,
			origin: secrets.RP_ORIGIN as string,
			factor: 'either' as FidoFactor,
			publicKey,
			prevCounter: previousCounter,
			userHandle: id
		};

		const result = (await fido2!.assertionResult(
			assertion,
			assertionExpectations
		)) as Fido2AssertionResult;

		logger.info('Passkey authentication verified successfully.');
		return result;
	} catch (utilError) {
		const utility: string = 'verifyPasskeyAuthentication()';
		const utilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`Error occured with ${utility}. Failed to verify passkey authentication: ${utilError instanceof Error ? utilError.message : utilError} ; Returning Fido2AssertionResult as an empty object`,
				{ exposeToClient: false }
			);
		configService.getErrorLogger().logError(utilityError.message);
		errorHandler.handleError({ error: utilityError });
		return {} as Fido2AssertionResult;
	}
}
