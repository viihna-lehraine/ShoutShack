import { PublicKeyCredentialCreationOptions, PublicKeyCredentialRequestOptions, Fido2AttestationResult, Fido2AssertionResult, AttestationResult, AssertionResult } from 'fido2-lib';
import { Logger } from '../config/logger';
interface User {
    id: string;
    email: string;
    username: string;
    credential: {
        credentialId: string;
    }[];
}
declare function generatePasskeyRegistrationOptions(user: User, logger: Logger): Promise<PublicKeyCredentialCreationOptions>;
declare function verifyPasskeyRegistration(attestation: AttestationResult, expectedChallenge: string, logger: Logger): Promise<Fido2AttestationResult>;
declare function generatePasskeyAuthenticationOptions(user: User, logger: Logger): Promise<PublicKeyCredentialRequestOptions>;
declare function verifyPasskeyAuthentication(assertion: AssertionResult, expectedChallenge: string, publicKey: string, previousCounter: number, id: string, logger: Logger): Promise<Fido2AssertionResult>;
declare const _default: {
    generatePasskeyAuthenticationOptions: typeof generatePasskeyAuthenticationOptions;
    generatePasskeyRegistrationOptions: typeof generatePasskeyRegistrationOptions;
    verifyPasskeyAuthentication: typeof verifyPasskeyAuthentication;
    verifyPasskeyRegistration: typeof verifyPasskeyRegistration;
};
export default _default;
//# sourceMappingURL=fido2Util.d.ts.map