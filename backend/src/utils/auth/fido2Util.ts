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
}

async function ensureFido2Initialized(): Promise<void> {
	if (!fido2) {
		await initializeFido2();
	}
}

async function generatePasskeyRegistrationOptions(
	user: User
): Promise<PublicKeyCredentialCreationOptions> {
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
	return registrationOptions;
}

async function verifyPasskeyRegistration(
	attestation: AttestationResult,
	expectedChallenge: string
): Promise<Fido2AttestationResult> {
	await ensureFido2Initialized();
	secrets = await sops.getSecrets({
		logger,
		execSync,
		getDirectoryPath
	});
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

	return result;
}

async function generatePasskeyAuthenticationOptions(
	user: User
): Promise<PublicKeyCredentialRequestOptions> {
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

	return authenticationOptions;
}

async function verifyPasskeyAuthentication(
	assertion: AssertionResult,
	expectedChallenge: string,
	publicKey: string,
	previousCounter: number,
	id: string
): Promise<Fido2AssertionResult> {
	await ensureFido2Initialized();
	secrets = await sops.getSecrets({
		logger,
		execSync,
		getDirectoryPath
	});

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

	return result;
}

export default {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration
};
