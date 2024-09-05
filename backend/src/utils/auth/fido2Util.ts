import {
	ExpectedAssertionResult,
	ExpectedAttestationResult,
	Fido2Lib,
	PublicKeyCredentialCreationOptions,
	PublicKeyCredentialDescriptor,
	PublicKeyCredentialRequestOptions,
	Fido2AttestationResult,
	Fido2AssertionResult,
	AttestationResult,
	AssertionResult
} from 'fido2-lib';
import path from 'path';
import sops, { SecretsMap } from '../../utils/sops';
import { Logger } from '../../config/logger';
import {
	handleGeneralError,
	validateDependencies
} from '../../middleware/errorHandler';
import { execSync } from 'child_process';

let fido2: Fido2Lib | null = null;
let secrets: SecretsMap;

interface User {
	id: string;
	email: string;
	username: string;
	credential: {
		credentialId: string;
	}[];
}

function getDirectoryPath(): string {
	return path.resolve(process.cwd());
}

type Factor = 'first' | 'second' | 'either';

async function initializeFido2(logger: Logger): Promise<void> {
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'execSync', instance: execSync },
				{ name: 'getDirectoryPath', instance: getDirectoryPath }
			],
			logger
		);

		secrets = await sops.getSecrets({
			logger,
			execSync,
			getDirectoryPath
		});

		validateDependencies(
			[
				{ name: 'secrets.RP_ID', instance: secrets.RP_ID },
				{ name: 'secrets.RP_NAME', instance: secrets.RP_NAME },
				{
					name: 'secrets.FIDO_CHALLENGE_SIZE',
					instance: secrets.FIDO_CHALLENGE_SIZE
				}
			],
			logger
		);

		// Initialize Fido2Lib instance
		fido2 = new Fido2Lib({
			timeout: 60000,
			rpId: secrets.RP_ID,
			rpName: secrets.RP_NAME,
			challengeSize: secrets.FIDO_CHALLENGE_SIZE,
			cryptoParams: secrets.FIDO_CRYPTO_PARAMETERS,
			authenticatorRequireResidentKey:
				secrets.FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY,
			authenticatorUserVerification:
				secrets.FIDO_AUTHENTICATOR_USER_VERIFICATION
		});

		logger.info('Fido2Lib initialized successfully.');
	} catch (error) {
		handleGeneralError(error, logger);
		throw new Error('Failed to initialize Fido2Lib');
	}
}

async function ensureFido2Initialized(logger: Logger): Promise<void> {
	validateDependencies([{ name: 'logger', instance: logger }], logger);

	if (!fido2) {
		logger.debug('Fido2Lib is not initialized, initializing now.');
		await initializeFido2(logger);
	}
}

async function generatePasskeyRegistrationOptions(
	user: User,
	logger: Logger
): Promise<PublicKeyCredentialCreationOptions> {
	try {
		validateDependencies(
			[
				{ name: 'user', instance: user },
				{ name: 'logger', instance: logger }
			],
			logger
		);

		await ensureFido2Initialized(logger);

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
	} catch (error) {
		handleGeneralError(error, logger);
		throw new Error('Failed to generate passkey registration options');
	}
}

async function verifyPasskeyRegistration(
	attestation: AttestationResult,
	expectedChallenge: string,
	logger: Logger
): Promise<Fido2AttestationResult> {
	try {
		validateDependencies(
			[
				{ name: 'attestation', instance: attestation },
				{ name: 'expectedChallenge', instance: expectedChallenge },
				{ name: 'logger', instance: logger }
			],
			logger
		);

		await ensureFido2Initialized(logger);

		const u2fAttestationExpectations: ExpectedAttestationResult = {
			challenge: expectedChallenge,
			origin: secrets.RP_ORIGIN as string,
			factor: 'either' as Factor,
			rpId: secrets.RP_ID
		};

		const result = (await fido2!.attestationResult(
			attestation,
			u2fAttestationExpectations
		)) as Fido2AttestationResult;

		logger.info('Passkey registration verified successfully.');
		return result;
	} catch (error) {
		handleGeneralError(error, logger);
		throw new Error('Failed to verify passkey registration');
	}
}

async function generatePasskeyAuthenticationOptions(
	user: User,
	logger: Logger
): Promise<PublicKeyCredentialRequestOptions> {
	try {
		validateDependencies(
			[
				{ name: 'user', instance: user },
				{ name: 'logger', instance: logger }
			],
			logger
		);

		await ensureFido2Initialized(logger);

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
	} catch (error) {
		handleGeneralError(error, logger);
		throw new Error('Failed to generate passkey authentication options');
	}
}

async function verifyPasskeyAuthentication(
	assertion: AssertionResult,
	expectedChallenge: string,
	publicKey: string,
	previousCounter: number,
	id: string,
	logger: Logger
): Promise<Fido2AssertionResult> {
	try {
		validateDependencies(
			[
				{ name: 'assertion', instance: assertion },
				{ name: 'expectedChallenge', instance: expectedChallenge },
				{ name: 'publicKey', instance: publicKey },
				{ name: 'previousCounter', instance: previousCounter },
				{ name: 'id', instance: id },
				{ name: 'logger', instance: logger }
			],
			logger
		);

		await ensureFido2Initialized(logger);

		const assertionExpectations: ExpectedAssertionResult = {
			challenge: expectedChallenge,
			origin: secrets.RP_ORIGIN as string,
			factor: 'either' as Factor,
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
	} catch (error) {
		handleGeneralError(error, logger);
		throw new Error('Failed to verify passkey authentication');
	}
}

export default {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration
};
