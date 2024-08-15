import { Fido2Lib } from 'fido2-lib';
import getSecrets from '../../config/secrets.js';

const secrets = await getSecrets();
let fido2;

(async () => {
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
		authenticatorUserVerification: secrets.FIDO_AUTHENTICATOR_USER_VERIFICATION,
	});
})();

async function generatePasskeyRegistrationOptions(user) {
	const passkeyRegistrationOptions = await fido2.attestationOptions({
		user: {
			id: Buffer.from(user.id, 'utf8').toString('base64'),
			name: user.email,
			displayName: user.username,
		},
		authenticatorSelection: {
			authenticatorAttachment: 'platform',
			residentKey: 'required',
			userVerification: 'required',
		},
		attestation: 'direct',
	});

	return passkeyRegistrationOptions;
}

async function verifyPasskeyRegistration(attestation, expectedChallenge) {
	const attestationExpectations = {
		challenge: expectedChallenge,
		origin: secrets.RP_ORIGIN,
		factor: 'either',
		rpId: secrets.RP_ID,
	};

	return await fido2.attestationResult(attestation, attestationExpectations);
}

async function generatePasskeyAuthenticationOptions(user) {
	const userCredentials = user.credentials.map((credential) => ({
		type: 'public-key',
		id: credential.credentialId,
	}));

	return await fido2.assertionOptions({
		allowCredentials: userCredentials,
		userVerification: 'required',
		timeout: 60000,
	});
}

async function verifyPasskeyAuthentication(
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
		userHandle: userId,
	};

	return await fido2.assertionResult(assertion, assertionExpectations);
}

export {
	generatePasskeyAuthenticationOptions,
	generatePasskeyRegistrationOptions,
	verifyPasskeyAuthentication,
	verifyPasskeyRegistration,
};
