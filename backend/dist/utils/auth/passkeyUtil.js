'use strict';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzc2tleVV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvYXV0aC9wYXNza2V5VXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXlKRSIsInNvdXJjZXNDb250ZW50IjpbIi8qICpERVYtTk9URSogTkVFRFMgQSBDT01QTEVURSBSRUJVSUxEXG5pbXBvcnQge1xuXHRBc3NlcnRpb25SZXN1bHQsXG5cdEF0dGVzdGF0aW9uUmVzdWx0LFxuXHRFeHBlY3RlZEFzc2VydGlvblJlc3VsdCxcblx0RXhwZWN0ZWRBdHRlc3RhdGlvblJlc3VsdCxcblx0RmlkbzJMaWIsXG5cdFB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnNcbn0gZnJvbSAnZmlkbzItbGliJztcbmltcG9ydCBnZXRTZWNyZXRzIGZyb20gJy4uLy4uL2NvbmZpZy9zZWNyZXRzLmpzJztcblxuaW50ZXJmYWNlIFVzZXIge1xuXHRpZDogc3RyaW5nO1xuXHRlbWFpbDogc3RyaW5nO1xuXHR1c2VybmFtZTogc3RyaW5nO1xuXHRjcmVkZW50aWFsOiB7XG5cdFx0Y3JlZGVudGlhbElkOiBzdHJpbmc7XG5cdH1bXTtcbn1cblxuaW50ZXJmYWNlIFNlY3JldHMge1xuXHRSUF9JRDogc3RyaW5nO1xuXHRSUF9OQU1FOiBzdHJpbmc7XG5cdFJQX0lDT046IHN0cmluZztcblx0UlBfT1JJR0lOOiBzdHJpbmc7XG5cdEZJRE9fQ0hBTExFTkdFX1NJWkU6IG51bWJlcjtcblx0RklET19DUllQVE9fUEFSQU1FVEVSUzogbnVtYmVyW107XG5cdEZJRE9fQVVUSEVOVElDQVRPUl9SRVFVSVJFX1JFU0lERU5UX0tFWTogYm9vbGVhbjtcblx0RklET19BVVRIRU5USUNBVE9SX1VTRVJfVkVSSUZJQ0FUSU9OOlxuXHRcdHwgJ3JlcXVpcmVkJ1xuXHRcdHwgJ3ByZWZlcnJlZCdcblx0XHR8ICdkaXNjb3VyYWdlZCc7XG59XG5cbnR5cGUgQXV0aGVudGljYXRvclRyYW5zcG9ydCA9ICd1c2InIHwgJ25mYycgfCAnYmxlJyB8ICdpbnRlcm5hbCc7XG5cbmxldCBmaWRvMjogRmlkbzJMaWI7XG5cbihhc3luYyAoKSA9PiB7XG5cdGNvbnN0IHNlY3JldHM6IFNlY3JldHMgPSBhd2FpdCBnZXRTZWNyZXRzKCk7XG5cblx0aWYgKCFzZWNyZXRzKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdTZWNyZXRzIGNvdWxkIG5vdCBiZSBsb2FkZWQnKTtcblx0fVxuXG5cdGZpZG8yID0gbmV3IEZpZG8yTGliKHtcblx0XHR0aW1lb3V0OiA2MDAwMCxcblx0XHRycElkOiBzZWNyZXRzLlJQX0lELFxuXHRcdHJwTmFtZTogc2VjcmV0cy5SUF9OQU1FLFxuXHRcdHJwSWNvbjogc2VjcmV0cy5SUF9JQ09OLFxuXHRcdGNoYWxsZW5nZVNpemU6IHNlY3JldHMuRklET19DSEFMTEVOR0VfU0laRSxcblx0XHRhdHRlc3RhdGlvbjogJ2RpcmVjdCcsXG5cdFx0Y3J5cHRvUGFyYW1zOiBzZWNyZXRzLkZJRE9fQ1JZUFRPX1BBUkFNRVRFUlMsXG5cdFx0YXV0aGVudGljYXRvclJlcXVpcmVSZXNpZGVudEtleTpcblx0XHRcdHNlY3JldHMuRklET19BVVRIRU5USUNBVE9SX1JFUVVJUkVfUkVTSURFTlRfS0VZLFxuXHRcdGF1dGhlbnRpY2F0b3JVc2VyVmVyaWZpY2F0aW9uOlxuXHRcdFx0c2VjcmV0cy5GSURPX0FVVEhFTlRJQ0FUT1JfVVNFUl9WRVJJRklDQVRJT05cblx0fSk7XG59KSgpO1xuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVBhc3NrZXlSZWdpc3RyYXRpb25PcHRpb25zKFxuXHR1c2VyOiBVc2VyXG4pOiBQcm9taXNlPFB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnM+IHtcblx0Y29uc3QgcGFzc2tleVJlZ2lzdHJhdGlvbk9wdGlvbnMgPSBhd2FpdCBmaWRvMi5hdHRlc3RhdGlvbk9wdGlvbnMoKTtcblxuXHQvLyBjb25zdHJ1Y3RpbmcgUHVibGljS2V5Q3JlZGVudGlhbENyZWF0aW9uT3B0aW9uc1xuXHRjb25zdCBjcmVkZW50aWFsQ3JlYXRpb25PcHRpb25zOiBQdWJsaWNLZXlDcmVkZW50aWFsQ3JlYXRpb25PcHRpb25zID0ge1xuXHRcdC4uLnBhc3NrZXlSZWdpc3RyYXRpb25PcHRpb25zLFxuXHRcdHVzZXI6IHtcblx0XHRcdGlkOiBCdWZmZXIuZnJvbSh1c2VyLmlkLCAndXRmOCcpLFxuXHRcdFx0bmFtZTogdXNlci5lbWFpbCxcblx0XHRcdGRpc3BsYXlOYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0fSxcblx0XHRhdXRoZW50aWNhdG9yU2VsZWN0aW9uOiB7XG5cdFx0XHRhdXRoZW50aWNhdG9yQXR0YWNobWVudDogJ3BsYXRmb3JtJyxcblx0XHRcdHJlcXVpcmVSZXNpZGVudEtleTogdHJ1ZSxcblx0XHRcdHVzZXJWZXJpZmljYXRpb246ICdyZXF1aXJlZCdcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIGNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmeVBhc3NrZXlSZWdpc3RyYXRpb24oXG5cdGF0dGVzdGF0aW9uOiBBdHRlc3RhdGlvblJlc3VsdCxcblx0ZXhwZWN0ZWRDaGFsbGVuZ2U6IHN0cmluZ1xuKSB7XG5cdGNvbnN0IHNlY3JldHM6IFNlY3JldHMgPSBhd2FpdCBnZXRTZWNyZXRzKCk7XG5cblx0aWYgKCFzZWNyZXRzKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdTZWNyZXRzIGNvdWxkIG5vdCBiZSBsb2FkZWQnKTtcblx0fVxuXG5cdGNvbnN0IGF0dGVzdGF0aW9uRXhwZWN0YXRpb25zOiBFeHBlY3RlZEF0dGVzdGF0aW9uUmVzdWx0ID0ge1xuXHRcdGNoYWxsZW5nZTogZXhwZWN0ZWRDaGFsbGVuZ2UsXG5cdFx0b3JpZ2luOiBzZWNyZXRzLlJQX09SSUdJTixcblx0XHRmYWN0b3I6ICdlaXRoZXInLCAvLyAnZmFjdG9yYCB0eXBlIHNob3VsZCBtYXRjaCBhcyBkZWZpbmVkIGluIHRoZSBsaWJyYXJ5XG5cdFx0cnBJZDogc2VjcmV0cy5SUF9JRFxuXHR9O1xuXG5cdHJldHVybiBhd2FpdCBmaWRvMi5hdHRlc3RhdGlvblJlc3VsdChhdHRlc3RhdGlvbiwgYXR0ZXN0YXRpb25FeHBlY3RhdGlvbnMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVBhc3NrZXlBdXRoZW50aWNhdGlvbk9wdGlvbnMoXG5cdHVzZXI6IFVzZXJcbik6IFByb21pc2U8UHVibGljS2V5Q3JlZGVudGlhbFJlcXVlc3RPcHRpb25zPiB7XG5cdGNvbnN0IHVzZXJDcmVkZW50aWFscyA9IHVzZXIuY3JlZGVudGlhbC5tYXAoY3JlZCA9PiAoe1xuXHRcdHR5cGU6ICdwdWJsaWMta2V5JyBhcyBjb25zdCwgLy8gZW5zdXJlcyAncHVibGljLWtleScgaXMgc3RyaWN0bHkgdHlwZWRcblx0XHRpZDogQnVmZmVyLmZyb20oY3JlZC5jcmVkZW50aWFsSWQsICdiYXNlNjQnKSxcblx0XHR0cmFuc3BvcnRzOiBbJ3VzYicsICduZmMnLCAnYmxlJ10gYXMgQXV0aGVudGljYXRvclRyYW5zcG9ydFtdIC8vICpERVYtTk9URSogdGhlc2UgYXJlIGp1c3QgZXhhbXBsZSB0cmFuc3BvcnRzIVxuXHR9KSk7XG5cblx0Y29uc3QgYXNzZXJ0aW9uT3B0aW9uczogUHVibGljS2V5Q3JlZGVudGlhbFJlcXVlc3RPcHRpb25zID0ge1xuXHRcdC4uLihhd2FpdCBmaWRvMi5hc3NlcnRpb25PcHRpb25zKCkpLFxuXHRcdGFsbG93Q3JlZGVudGlhbHM6IHVzZXJDcmVkZW50aWFscyxcblx0XHR1c2VyVmVyaWZpY2F0aW9uOiAncmVxdWlyZWQnLFxuXHRcdHRpbWVvdXQ6IDYwMDAwXG5cdH07XG5cblx0cmV0dXJuIGFzc2VydGlvbk9wdGlvbnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmeVBhc3NrZXlBdXRoZW50aWNhdGlvbihcblx0YXNzZXJ0aW9uOiBBc3NlcnRpb25SZXN1bHQsXG5cdGV4cGVjdGVkQ2hhbGxlbmdlOiBzdHJpbmcsXG5cdHB1YmxpY0tleTogc3RyaW5nLFxuXHRwcmV2aW91c0NvdW50ZXI6IG51bWJlcixcblx0aWQ6IHN0cmluZ1xuKSB7XG5cdGNvbnN0IHNlY3JldHM6IFNlY3JldHMgPSBhd2FpdCBnZXRTZWNyZXRzKCk7XG5cblx0aWYgKCFzZWNyZXRzKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdTZWNyZXRzIGNvdWxkIG5vdCBiZSBsb2FkZWQnKTtcblx0fVxuXG5cdGNvbnN0IGFzc2VydGlvbkV4cGVjdGF0aW9uczogRXhwZWN0ZWRBc3NlcnRpb25SZXN1bHQgPSB7XG5cdFx0Y2hhbGxlbmdlOiBleHBlY3RlZENoYWxsZW5nZSxcblx0XHRvcmlnaW46IHNlY3JldHMuUlBfT1JJR0lOLFxuXHRcdGZhY3RvcjogJ2VpdGhlcicsXG5cdFx0cHVibGljS2V5LFxuXHRcdHByZXZDb3VudGVyOiBwcmV2aW91c0NvdW50ZXIsXG5cdFx0dXNlckhhbmRsZTogaWRcblx0fTtcblxuXHRyZXR1cm4gYXdhaXQgZmlkbzIuYXNzZXJ0aW9uUmVzdWx0KGFzc2VydGlvbiwgYXNzZXJ0aW9uRXhwZWN0YXRpb25zKTtcbn1cblxuZXhwb3J0IHtcblx0Z2VuZXJhdGVQYXNza2V5QXV0aGVudGljYXRpb25PcHRpb25zLFxuXHRnZW5lcmF0ZVBhc3NrZXlSZWdpc3RyYXRpb25PcHRpb25zLFxuXHR2ZXJpZnlQYXNza2V5QXV0aGVudGljYXRpb24sXG5cdHZlcmlmeVBhc3NrZXlSZWdpc3RyYXRpb25cbn07XG4qL1xuIl19
