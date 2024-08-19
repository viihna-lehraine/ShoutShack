import {
	AssertionResult,
	AttestationResult,
	ExpectedAssertionResult,
	ExpectedAttestationResult,
	Fido2Lib,
	PublicKeyCredentialCreationOptions,
	PublicKeyCredentialRequestOptions
} from 'fido2-lib';
import getSecrets from '../../config/secrets.js';

let fido2: Fido2Lib;

interface User {
	id: string;
	email: string;
	username: string;
	credential: {
		credentialId: string;
	}[];
}

interface Secrets {
	RP_ID: string;
	RP_NAME: string;
	RP_ICON: string;
	RP_ORIGIN: string;
	FIDO_CHALLENGE_SIZE: number;
	FIDO_CRYPTO_PARAMETERS: number[];
	FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY: boolean;
	FIDO_AUTHENTICATOR_USER_VERIFICATION: 'required' | 'preferred' | 'discouraged';
}

type Factor = 'first' | 'second' | 'either';

(async () => {
	let secrets: Secrets = await getSecrets();

	if (!secrets) {
		throw new Error('Secrets could not be loaded');
	}
	fido2 = new Fido2Lib({
		timeout: 60000,
		rpId: secrets.RP_ID,
		rpName: secrets.RP_NAME,
		challengeSize: secrets.FIDO_CHALLENGE_SIZE,
		attestation: 'indirect', // values: 'none', 'indirect', 'direct', 'enterprise'
		cryptoParams: secrets.FIDO_CRYPTO_PARAMETERS,
		authenticatorRequireResidentKey: secrets.FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY,
		authenticatorUserVerification: secrets.FIDO_AUTHENTICATOR_USER_VERIFICATION,
	});
})();

async function generateU2fRegistrationOptions(user: User): Promise<PublicKeyCredentialCreationOptions> {
	const passkeyRegistrationOptions = await fido2.attestationOptions();

	const u2fRegistrationOptions: PublicKeyCredentialCreationOptions = {
		...passkeyRegistrationOptions,
		user: {
			id: Buffer.from(user.id, 'utf8'), // UID from db (base64 encoded)
			name: user.email,
			displayName: user.username,
		},
		pubKeyCredParams: [
			{ type: 'public-key', alg: -7 }
		],
		timeout: 60000,
		attestation: 'direct',
		authenticatorSelection: {
			authenticatorAttachment: 'platform',
			requireResidentKey: true,  // Correct property name
			userVerification: 'required',
		}
	};
	return u2fRegistrationOptions;
}

async function verifyU2fRegistration(attestation: AttestationResult, expectedChallenge: string) {
	let secrets: Secrets = await getSecrets();

	if (!secrets) {
		throw new Error('Secrets could not be loaded');
	}

	const u2fAttestationExpectations: ExpectedAttestationResult = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either' as Factor,
		rpId: secrets.RP_ID,
	};

	return await fido2.attestationResult(attestation, u2fAttestationExpectations);
}

async function generateU2fAuthenticationOptions(user: User): Promise<PublicKeyCredentialRequestOptions> {
	const userCredentials = user.credential.map((credential) => ({
		type: 'public-key' as const,  // Explicit type
		id: Buffer.from(credential.credentialId, 'base64'),
	}));

	const assertionOptions = await fido2.assertionOptions();

	const u2fAuthenticationOptions: PublicKeyCredentialRequestOptions = {
		...assertionOptions,
		allowCredentials: userCredentials,
		userVerification: 'preferred',
		timeout: 60000
	};

	return u2fAuthenticationOptions;
}

async function verifyU2fAuthentication(
	assertion: AssertionResult,
	expectedChallenge: string,
	publicKey: string,
	previousCounter: number,
	id: string
) {
	let secrets: Secrets = await getSecrets();

	if (!secrets) {
		throw new Error('Secrets could not be loaded');
	}
	const assertionExpectations: ExpectedAssertionResult = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either' as Factor,
		publicKey: publicKey,
		prevCounter: previousCounter,
		userHandle: id,
	};

	return await fido2.assertionResult(assertion, assertionExpectations);
}

export {
    generateU2fAuthenticationOptions,
    generateU2fRegistrationOptions,
    verifyU2fAuthentication,
    verifyU2fRegistration,
};