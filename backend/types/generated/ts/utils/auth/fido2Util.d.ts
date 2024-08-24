import {
	AssertionResult,
	AttestationResult,
	PublicKeyCredentialCreationOptions,
	PublicKeyCredentialRequestOptions
} from 'fido2-lib';
interface User {
	id: string;
	email: string;
	username: string;
	credential: {
		credentialId: string;
	}[];
}
declare function generateU2fRegistrationOptions(
	user: User
): Promise<PublicKeyCredentialCreationOptions>;
declare function verifyU2fRegistration(
	attestation: AttestationResult,
	expectedChallenge: string
): Promise<import('fido2-lib').Fido2AttestationResult>;
declare function generateU2fAuthenticationOptions(
	user: User
): Promise<PublicKeyCredentialRequestOptions>;
declare function verifyU2fAuthentication(
	assertion: AssertionResult,
	expectedChallenge: string,
	publicKey: string,
	previousCounter: number,
	id: string
): Promise<import('fido2-lib').Fido2AssertionResult>;
export {
	generateU2fAuthenticationOptions,
	generateU2fRegistrationOptions,
	verifyU2fAuthentication,
	verifyU2fRegistration
};
//# sourceMappingURL=fido2Util.d.ts.map
