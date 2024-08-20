import { Fido2Lib } from 'fido2-lib';
import getSecrets from '../../config/secrets.js';

const secrets = await getSecrets();
let fido2;

(async () => {
	fido2 = new Fido2Lib({
		timeout: 60000,
		rpId: secrets.RP_ID,
		rpName: secrets.RP_NAME,
		challengeSize: secrets.FIDO_CHALLENGE_SIZE,
		attestation: 'indirect', // value can be 'none', 'indirect', 'diect', or 'enterprise'
		cryptoParams: secrets.FIDO_CRYPTO_PARAMETERS, // supported algorithms
		authenticatorRequireResidentKey:
			secrets.FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY,
		authenticatorUserVerification:
			secrets.FIDO_AUTHENTICATOR_USER_VERIFICATION
	});
})();

async function generateU2fRegistrationOptions(user) {
	const u2fRegistrationOptions = await fido2.attestationOptions({
		user: {
			id: Buffer.from(user.id, 'utf8').toString('base64'), // user ID from database (base64 encoded)
			name: user.email,
			displayName: user.username
		}
	});
	return u2fRegistrationOptions;
}

async function verifyU2fRegistration(attestation, expectedChallenge) {
	const u2fAttestationExpectations = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either'
	};

	return await fiodo2.attestationResult(
		attestation,
		u2fAttestationExpectations
	);
}

async function generateU2fAuthenticationOptions(user) {
	const userCredentials = user.credentials.map((credential) => ({
		type: 'public-key',
		id: credential.credentialId
	}));

	return await fido2.assertionOptions({
		allowCredentials: userCredentials,
		userVerification: 'preferred'
	});
}

async function verifyU2fAuthentication(
	assertion,
	expectedChallenge,
	publicKey,
	previousCounter,
	userId
) {
	const assertionExpectations = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either',
		publicKey: publicKey,
		prevCounter: previousCounter,
		userHandle: userId
	};

	return await fido2.assertionResult(assertion, assertionExpectations);
}

export async function loadU2fUtils() {
	const {
		generateU2fAuthenticationOptions,
		generateU2fRegistrationOptions,
		verifyU2fAuthentication,
		verifyU2fRegistration
	} = await import('./utils/auth/fido2Util.js');

	return {
		generateU2fAuthenticationOptions,
		generateU2fRegistrationOptions,
		verifyU2fAuthentication,
		verifyU2fRegistration
	};
}
