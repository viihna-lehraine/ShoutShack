import { AssertionResult, AttestationResult, PublicKeyCredentialCreationOptions } from 'fido2-lib';
interface User {
    id: string;
    email: string;
    username: string;
    credential: {
        credentialId: string;
    }[];
}
declare function generatePasskeyRegistrationOptions(user: User): Promise<PublicKeyCredentialCreationOptions>;
declare function verifyPasskeyRegistration(attestation: AttestationResult, expectedChallenge: string): Promise<import("fido2-lib").Fido2AttestationResult>;
declare function generatePasskeyAuthenticationOptions(user: User): Promise<PublicKeyCredentialRequestOptions>;
declare function verifyPasskeyAuthentication(assertion: AssertionResult, expectedChallenge: string, publicKey: string, previousCounter: number, id: string): Promise<import("fido2-lib").Fido2AssertionResult>;
export { generatePasskeyAuthenticationOptions, generatePasskeyRegistrationOptions, verifyPasskeyAuthentication, verifyPasskeyRegistration };
//# sourceMappingURL=passkeyUtil.d.ts.map