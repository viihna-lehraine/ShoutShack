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
import { setupLogger } from '../../config/logger';
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

type Factor = 'first' | 'second' | 'either';

const logger = setupLogger();

function getDirectoryPath(): string {
	return path.resolve(process.cwd());
}

async function initializeFido2(): Promise<void> {
	try {
		secrets = await sops.getSecrets({
			logger,
			execSync,
			getDirectoryPath
		});

		if (!secrets) {
			throw new Error('Secrets could not be loaded');
		}

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
		logger.error(
			`Failed to initialize Fido2Lib: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error('Failed to initialize Fido2Lib');
	}
}

async function ensureFido2Initialized(): Promise<void> {
	if (!fido2) {
		logger.debug('Fido2Lib is not initialized, initializing now.');
		await initializeFido2();
	}
}

async function generatePasskeyRegistrationOptions(
	user: User
): Promise<PublicKeyCredentialCreationOptions> {
	try {
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
	} catch (error) {
		logger.error(
			`Failed to generate passkey registration options: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error('Failed to generate passkey registration options');
	}
}

async function verifyPasskeyRegistration(
	attestation: AttestationResult,
	expectedChallenge: string
): Promise<Fido2AttestationResult> {
	try {
		await ensureFido2Initialized();

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
		logger.error(
			`Failed to verify passkey registration: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error('Failed to verify passkey registration');
	}
}

async function generatePasskeyAuthenticationOptions(
	user: User
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
			userVerification: 'required', // ensure this supports passwordless login
			timeout: 60000
		};

		logger.info('Passkey authentication options generated successfully.');
		return authenticationOptions;
	} catch (error) {
		logger.error(
			`Failed to generate passkey authentication options: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error('Failed to generate passkey authentication options');
	}
}

async function verifyPasskeyAuthentication(
	assertion: AssertionResult,
	expectedChallenge: string,
	publicKey: string,
	previousCounter: number,
	id: string
): Promise<Fido2AssertionResult> {
	try {
		await ensureFido2Initialized();

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
		logger.error(
			`Failed to verify passkey authentication: ${error instanceof Error ? error.message : String(error)}`
		);
		throw new Error('Failed to verify passkey authentication');
	}
}

export default {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration
};
