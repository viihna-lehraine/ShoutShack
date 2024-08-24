/* *DEV-NOTE* NEEDS A COMPLETE REBUILD
import {
	AssertionResult,
	AttestationResult,
	ExpectedAssertionResult,
	ExpectedAttestationResult,
	Fido2Lib,
	PublicKeyCredentialCreationOptions
} from 'fido2-lib';
import getSecrets from '../../config/secrets.js';

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
	FIDO_AUTHENTICATOR_USER_VERIFICATION:
		| 'required'
		| 'preferred'
		| 'discouraged';
}

type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal';

let fido2: Fido2Lib;

(async () => {
	const secrets: Secrets = await getSecrets();

	if (!secrets) {
		throw new Error('Secrets could not be loaded');
	}

	fido2 = new Fido2Lib({
		timeout: 60000,
		rpId: secrets.RP_ID,
		rpName: secrets.RP_NAME,
		rpIcon: secrets.RP_ICON,
		challengeSize: secrets.FIDO_CHALLENGE_SIZE,
		attestation: 'direct',
		cryptoParams: secrets.FIDO_CRYPTO_PARAMETERS,
		authenticatorRequireResidentKey:
			secrets.FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY,
		authenticatorUserVerification:
			secrets.FIDO_AUTHENTICATOR_USER_VERIFICATION
	});
})();

async function generatePasskeyRegistrationOptions(
	user: User
): Promise<PublicKeyCredentialCreationOptions> {
	const passkeyRegistrationOptions = await fido2.attestationOptions();

	// constructing PublicKeyCredentialCreationOptions
	const credentialCreationOptions: PublicKeyCredentialCreationOptions = {
		...passkeyRegistrationOptions,
		user: {
			id: Buffer.from(user.id, 'utf8'),
			name: user.email,
			displayName: user.username
		},
		authenticatorSelection: {
			authenticatorAttachment: 'platform',
			requireResidentKey: true,
			userVerification: 'required'
		}
	};

	return credentialCreationOptions;
}

async function verifyPasskeyRegistration(
	attestation: AttestationResult,
	expectedChallenge: string
) {
	const secrets: Secrets = await getSecrets();

	if (!secrets) {
		throw new Error('Secrets could not be loaded');
	}

	const attestationExpectations: ExpectedAttestationResult = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either', // 'factor` type should match as defined in the library
		rpId: secrets.RP_ID
	};

	return await fido2.attestationResult(attestation, attestationExpectations);
}

async function generatePasskeyAuthenticationOptions(
	user: User
): Promise<PublicKeyCredentialRequestOptions> {
	const userCredentials = user.credential.map(cred => ({
		type: 'public-key' as const, // ensures 'public-key' is strictly typed
		id: Buffer.from(cred.credentialId, 'base64'),
		transports: ['usb', 'nfc', 'ble'] as AuthenticatorTransport[] // *DEV-NOTE* these are just example transports!
	}));

	const assertionOptions: PublicKeyCredentialRequestOptions = {
		...(await fido2.assertionOptions()),
		allowCredentials: userCredentials,
		userVerification: 'required',
		timeout: 60000
	};

	return assertionOptions;
}

async function verifyPasskeyAuthentication(
	assertion: AssertionResult,
	expectedChallenge: string,
	publicKey: string,
	previousCounter: number,
	id: string
) {
	const secrets: Secrets = await getSecrets();

	if (!secrets) {
		throw new Error('Secrets could not be loaded');
	}

	const assertionExpectations: ExpectedAssertionResult = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either',
		publicKey,
		prevCounter: previousCounter,
		userHandle: id
	};

	return await fido2.assertionResult(assertion, assertionExpectations);
}

export {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration
};
*/
