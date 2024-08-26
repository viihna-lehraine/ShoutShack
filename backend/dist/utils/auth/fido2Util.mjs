'use strict';
/* *DEV-NOTE* NEEDS A COMPLETE REBUILD
import {
    ExpectedAssertionResult,
    ExpectedAttestationResult,
    Fido2Lib,
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialRequestOptions
} from 'fido2-lib';
import getSecrets from '../../config/secrets.mjs';
import {
    AssertionResult,
    AttestationResult,
    Fido2AttestationResult,
    Fido2AssertionResult
} from '../../../types/custom/fido2-lib.mjs';

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
    FIDO_AUTHENTICATOR_USER_VERIFICATION:
        | 'required'
        | 'preferred'
        | 'discouraged';
}

type Factor = 'first' | 'second' | 'either';

(async (): Promise<void> => {
    const secrets: Secrets = await getSecrets();

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
        authenticatorRequireResidentKey:
            secrets.FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY,
        authenticatorUserVerification:
            secrets.FIDO_AUTHENTICATOR_USER_VERIFICATION
    });
})();

async function generateU2fRegistrationOptions(
    user: User
): Promise<PublicKeyCredentialCreationOptions> {
    const passkeyRegistrationOptions = await fido2.attestationOptions();

    const u2fRegistrationOptions: PublicKeyCredentialCreationOptions = {
        ...passkeyRegistrationOptions,
        user: {
            id: Buffer.from(user.id, 'utf8'), // UID from db (base64 encoded)
            name: user.email,
            displayName: user.username
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'direct',
        authenticatorSelection: {
            authenticatorAttachment: 'platform',
            requireResidentKey: true, // Correct property name
            userVerification: 'required'
        }
    };
    return u2fRegistrationOptions;
}

async function verifyU2fRegistration(
    attestation: AttestationResult,
    expectedChallenge: string
): Promise<AttestationResult> {
    const secrets: Secrets = await getSecrets();
    const u2fAttestationExpectations: ExpectedAttestationResult = {
        challenge: expectedChallenge,
        origin: secrets.RP_ORIGIN,
        factor: 'either' as Factor,
        rpId: secrets.RP_ID
    };

    const result = (await fido2.attestationResult(
        attestation,
        u2fAttestationExpectations
    )) as Fido2AttestationResult;

    // TypeScript now understands that `result.request` is of type `AttestationResult`
    return result;
}

async function generateU2fAuthenticationOptions(
    user: User
): Promise<PublicKeyCredentialRequestOptions> {
    const userCredentials = user.credential.map(credential => ({
        type: 'public-key' as const, // Explicit type
        id: Buffer.from(credential.credentialId, 'base64')
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
): Promise<AssertionResult> {
    const secrets: Secrets = await getSecrets();

    const assertionExpectations: ExpectedAssertionResult = {
        challenge: expectedChallenge,
        origin: secrets.RP_ORIGIN,
        factor: 'either' as Factor,
        publicKey,
        prevCounter: previousCounter,
        userHandle: id
    };

    const result = (await fido2.assertionResult(
        assertion,
        assertionExpectations
    )) as Fido2AssertionResult;

    // TypeScript now understands that `result.request` is of type `AssertionResult`
    return result;
}

export {
    generateU2fAuthenticationOptions,
    generateU2fRegistrationOptions,
    verifyU2fAuthentication,
    verifyU2fRegistration
};
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlkbzJVdGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2F1dGgvZmlkbzJVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFpS0UiLCJzb3VyY2VzQ29udGVudCI6WyIvKiAqREVWLU5PVEUqIE5FRURTIEEgQ09NUExFVEUgUkVCVUlMRFxuaW1wb3J0IHtcblx0RXhwZWN0ZWRBc3NlcnRpb25SZXN1bHQsXG5cdEV4cGVjdGVkQXR0ZXN0YXRpb25SZXN1bHQsXG5cdEZpZG8yTGliLFxuXHRQdWJsaWNLZXlDcmVkZW50aWFsQ3JlYXRpb25PcHRpb25zLFxuXHRQdWJsaWNLZXlDcmVkZW50aWFsUmVxdWVzdE9wdGlvbnNcbn0gZnJvbSAnZmlkbzItbGliJztcbmltcG9ydCBnZXRTZWNyZXRzIGZyb20gJy4uLy4uL2NvbmZpZy9zZWNyZXRzLmpzJztcbmltcG9ydCB7XG5cdEFzc2VydGlvblJlc3VsdCxcblx0QXR0ZXN0YXRpb25SZXN1bHQsXG5cdEZpZG8yQXR0ZXN0YXRpb25SZXN1bHQsXG5cdEZpZG8yQXNzZXJ0aW9uUmVzdWx0XG59IGZyb20gJy4uLy4uLy4uL3R5cGVzL2N1c3RvbS9maWRvMi1saWIuanMnO1xuXG5sZXQgZmlkbzI6IEZpZG8yTGliO1xuXG5pbnRlcmZhY2UgVXNlciB7XG5cdGlkOiBzdHJpbmc7XG5cdGVtYWlsOiBzdHJpbmc7XG5cdHVzZXJuYW1lOiBzdHJpbmc7XG5cdGNyZWRlbnRpYWw6IHtcblx0XHRjcmVkZW50aWFsSWQ6IHN0cmluZztcblx0fVtdO1xufVxuXG5pbnRlcmZhY2UgU2VjcmV0cyB7XG5cdFJQX0lEOiBzdHJpbmc7XG5cdFJQX05BTUU6IHN0cmluZztcblx0UlBfSUNPTjogc3RyaW5nO1xuXHRSUF9PUklHSU46IHN0cmluZztcblx0RklET19DSEFMTEVOR0VfU0laRTogbnVtYmVyO1xuXHRGSURPX0NSWVBUT19QQVJBTUVURVJTOiBudW1iZXJbXTtcblx0RklET19BVVRIRU5USUNBVE9SX1JFUVVJUkVfUkVTSURFTlRfS0VZOiBib29sZWFuO1xuXHRGSURPX0FVVEhFTlRJQ0FUT1JfVVNFUl9WRVJJRklDQVRJT046XG5cdFx0fCAncmVxdWlyZWQnXG5cdFx0fCAncHJlZmVycmVkJ1xuXHRcdHwgJ2Rpc2NvdXJhZ2VkJztcbn1cblxudHlwZSBGYWN0b3IgPSAnZmlyc3QnIHwgJ3NlY29uZCcgfCAnZWl0aGVyJztcblxuKGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcblx0Y29uc3Qgc2VjcmV0czogU2VjcmV0cyA9IGF3YWl0IGdldFNlY3JldHMoKTtcblxuXHRpZiAoIXNlY3JldHMpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1NlY3JldHMgY291bGQgbm90IGJlIGxvYWRlZCcpO1xuXHR9XG5cdGZpZG8yID0gbmV3IEZpZG8yTGliKHtcblx0XHR0aW1lb3V0OiA2MDAwMCxcblx0XHRycElkOiBzZWNyZXRzLlJQX0lELFxuXHRcdHJwTmFtZTogc2VjcmV0cy5SUF9OQU1FLFxuXHRcdGNoYWxsZW5nZVNpemU6IHNlY3JldHMuRklET19DSEFMTEVOR0VfU0laRSxcblx0XHRhdHRlc3RhdGlvbjogJ2luZGlyZWN0JywgLy8gdmFsdWVzOiAnbm9uZScsICdpbmRpcmVjdCcsICdkaXJlY3QnLCAnZW50ZXJwcmlzZSdcblx0XHRjcnlwdG9QYXJhbXM6IHNlY3JldHMuRklET19DUllQVE9fUEFSQU1FVEVSUyxcblx0XHRhdXRoZW50aWNhdG9yUmVxdWlyZVJlc2lkZW50S2V5OlxuXHRcdFx0c2VjcmV0cy5GSURPX0FVVEhFTlRJQ0FUT1JfUkVRVUlSRV9SRVNJREVOVF9LRVksXG5cdFx0YXV0aGVudGljYXRvclVzZXJWZXJpZmljYXRpb246XG5cdFx0XHRzZWNyZXRzLkZJRE9fQVVUSEVOVElDQVRPUl9VU0VSX1ZFUklGSUNBVElPTlxuXHR9KTtcbn0pKCk7XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlVTJmUmVnaXN0cmF0aW9uT3B0aW9ucyhcblx0dXNlcjogVXNlclxuKTogUHJvbWlzZTxQdWJsaWNLZXlDcmVkZW50aWFsQ3JlYXRpb25PcHRpb25zPiB7XG5cdGNvbnN0IHBhc3NrZXlSZWdpc3RyYXRpb25PcHRpb25zID0gYXdhaXQgZmlkbzIuYXR0ZXN0YXRpb25PcHRpb25zKCk7XG5cblx0Y29uc3QgdTJmUmVnaXN0cmF0aW9uT3B0aW9uczogUHVibGljS2V5Q3JlZGVudGlhbENyZWF0aW9uT3B0aW9ucyA9IHtcblx0XHQuLi5wYXNza2V5UmVnaXN0cmF0aW9uT3B0aW9ucyxcblx0XHR1c2VyOiB7XG5cdFx0XHRpZDogQnVmZmVyLmZyb20odXNlci5pZCwgJ3V0ZjgnKSwgLy8gVUlEIGZyb20gZGIgKGJhc2U2NCBlbmNvZGVkKVxuXHRcdFx0bmFtZTogdXNlci5lbWFpbCxcblx0XHRcdGRpc3BsYXlOYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0fSxcblx0XHRwdWJLZXlDcmVkUGFyYW1zOiBbeyB0eXBlOiAncHVibGljLWtleScsIGFsZzogLTcgfV0sXG5cdFx0dGltZW91dDogNjAwMDAsXG5cdFx0YXR0ZXN0YXRpb246ICdkaXJlY3QnLFxuXHRcdGF1dGhlbnRpY2F0b3JTZWxlY3Rpb246IHtcblx0XHRcdGF1dGhlbnRpY2F0b3JBdHRhY2htZW50OiAncGxhdGZvcm0nLFxuXHRcdFx0cmVxdWlyZVJlc2lkZW50S2V5OiB0cnVlLCAvLyBDb3JyZWN0IHByb3BlcnR5IG5hbWVcblx0XHRcdHVzZXJWZXJpZmljYXRpb246ICdyZXF1aXJlZCdcblx0XHR9XG5cdH07XG5cdHJldHVybiB1MmZSZWdpc3RyYXRpb25PcHRpb25zO1xufVxuXG5hc3luYyBmdW5jdGlvbiB2ZXJpZnlVMmZSZWdpc3RyYXRpb24oXG5cdGF0dGVzdGF0aW9uOiBBdHRlc3RhdGlvblJlc3VsdCxcblx0ZXhwZWN0ZWRDaGFsbGVuZ2U6IHN0cmluZ1xuKTogUHJvbWlzZTxBdHRlc3RhdGlvblJlc3VsdD4ge1xuXHRjb25zdCBzZWNyZXRzOiBTZWNyZXRzID0gYXdhaXQgZ2V0U2VjcmV0cygpO1xuXHRjb25zdCB1MmZBdHRlc3RhdGlvbkV4cGVjdGF0aW9uczogRXhwZWN0ZWRBdHRlc3RhdGlvblJlc3VsdCA9IHtcblx0XHRjaGFsbGVuZ2U6IGV4cGVjdGVkQ2hhbGxlbmdlLFxuXHRcdG9yaWdpbjogc2VjcmV0cy5SUF9PUklHSU4sXG5cdFx0ZmFjdG9yOiAnZWl0aGVyJyBhcyBGYWN0b3IsXG5cdFx0cnBJZDogc2VjcmV0cy5SUF9JRFxuXHR9O1xuXG5cdGNvbnN0IHJlc3VsdCA9IChhd2FpdCBmaWRvMi5hdHRlc3RhdGlvblJlc3VsdChcblx0XHRhdHRlc3RhdGlvbixcblx0XHR1MmZBdHRlc3RhdGlvbkV4cGVjdGF0aW9uc1xuXHQpKSBhcyBGaWRvMkF0dGVzdGF0aW9uUmVzdWx0O1xuXG5cdC8vIFR5cGVTY3JpcHQgbm93IHVuZGVyc3RhbmRzIHRoYXQgYHJlc3VsdC5yZXF1ZXN0YCBpcyBvZiB0eXBlIGBBdHRlc3RhdGlvblJlc3VsdGBcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVVMmZBdXRoZW50aWNhdGlvbk9wdGlvbnMoXG5cdHVzZXI6IFVzZXJcbik6IFByb21pc2U8UHVibGljS2V5Q3JlZGVudGlhbFJlcXVlc3RPcHRpb25zPiB7XG5cdGNvbnN0IHVzZXJDcmVkZW50aWFscyA9IHVzZXIuY3JlZGVudGlhbC5tYXAoY3JlZGVudGlhbCA9PiAoe1xuXHRcdHR5cGU6ICdwdWJsaWMta2V5JyBhcyBjb25zdCwgLy8gRXhwbGljaXQgdHlwZVxuXHRcdGlkOiBCdWZmZXIuZnJvbShjcmVkZW50aWFsLmNyZWRlbnRpYWxJZCwgJ2Jhc2U2NCcpXG5cdH0pKTtcblxuXHRjb25zdCBhc3NlcnRpb25PcHRpb25zID0gYXdhaXQgZmlkbzIuYXNzZXJ0aW9uT3B0aW9ucygpO1xuXG5cdGNvbnN0IHUyZkF1dGhlbnRpY2F0aW9uT3B0aW9uczogUHVibGljS2V5Q3JlZGVudGlhbFJlcXVlc3RPcHRpb25zID0ge1xuXHRcdC4uLmFzc2VydGlvbk9wdGlvbnMsXG5cdFx0YWxsb3dDcmVkZW50aWFsczogdXNlckNyZWRlbnRpYWxzLFxuXHRcdHVzZXJWZXJpZmljYXRpb246ICdwcmVmZXJyZWQnLFxuXHRcdHRpbWVvdXQ6IDYwMDAwXG5cdH07XG5cblx0cmV0dXJuIHUyZkF1dGhlbnRpY2F0aW9uT3B0aW9ucztcbn1cblxuYXN5bmMgZnVuY3Rpb24gdmVyaWZ5VTJmQXV0aGVudGljYXRpb24oXG5cdGFzc2VydGlvbjogQXNzZXJ0aW9uUmVzdWx0LFxuXHRleHBlY3RlZENoYWxsZW5nZTogc3RyaW5nLFxuXHRwdWJsaWNLZXk6IHN0cmluZyxcblx0cHJldmlvdXNDb3VudGVyOiBudW1iZXIsXG5cdGlkOiBzdHJpbmdcbik6IFByb21pc2U8QXNzZXJ0aW9uUmVzdWx0PiB7XG5cdGNvbnN0IHNlY3JldHM6IFNlY3JldHMgPSBhd2FpdCBnZXRTZWNyZXRzKCk7XG5cblx0Y29uc3QgYXNzZXJ0aW9uRXhwZWN0YXRpb25zOiBFeHBlY3RlZEFzc2VydGlvblJlc3VsdCA9IHtcblx0XHRjaGFsbGVuZ2U6IGV4cGVjdGVkQ2hhbGxlbmdlLFxuXHRcdG9yaWdpbjogc2VjcmV0cy5SUF9PUklHSU4sXG5cdFx0ZmFjdG9yOiAnZWl0aGVyJyBhcyBGYWN0b3IsXG5cdFx0cHVibGljS2V5LFxuXHRcdHByZXZDb3VudGVyOiBwcmV2aW91c0NvdW50ZXIsXG5cdFx0dXNlckhhbmRsZTogaWRcblx0fTtcblxuXHRjb25zdCByZXN1bHQgPSAoYXdhaXQgZmlkbzIuYXNzZXJ0aW9uUmVzdWx0KFxuXHRcdGFzc2VydGlvbixcblx0XHRhc3NlcnRpb25FeHBlY3RhdGlvbnNcblx0KSkgYXMgRmlkbzJBc3NlcnRpb25SZXN1bHQ7XG5cblx0Ly8gVHlwZVNjcmlwdCBub3cgdW5kZXJzdGFuZHMgdGhhdCBgcmVzdWx0LnJlcXVlc3RgIGlzIG9mIHR5cGUgYEFzc2VydGlvblJlc3VsdGBcblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IHtcblx0Z2VuZXJhdGVVMmZBdXRoZW50aWNhdGlvbk9wdGlvbnMsXG5cdGdlbmVyYXRlVTJmUmVnaXN0cmF0aW9uT3B0aW9ucyxcblx0dmVyaWZ5VTJmQXV0aGVudGljYXRpb24sXG5cdHZlcmlmeVUyZlJlZ2lzdHJhdGlvblxufTtcbiovXG4iXX0=
