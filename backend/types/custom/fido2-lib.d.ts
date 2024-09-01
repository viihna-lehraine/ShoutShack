import { assert } from 'console';

declare module 'fido2-lib' {
    import { Buffer } from 'buffer';

    export interface PublicKeyCredentialCreationOptions {
        user: {
            id: Buffer;
            name: string;
            displayName: string;
        };
        pubKeyCredParams: Array<{
            type: 'public-key';
            alg: number;
        }>;
        timeout: number;
        attestation: 'none' | 'indirect' | 'direct' | 'enterprise';
        authenticatorSelection?: {
            authenticatorAttachment?: 'platform' | 'cross-platform';
            requireResidentKey?: boolean;
            userVerification?: 'required' | 'preferred' | 'discouraged';
        };
    }

    export interface PublicKeyCredentialRequestOptions {
        allowCredentials: Array<{
            type: 'public-key';
            id: Buffer;
        }>;
        timeout: number;
        userVerification: 'required' | 'preferred' | 'discouraged';
    }

    export interface ExpectedAttestationResult {
        challenge: string;
        origin: string;
        factor: 'first' | 'second' | 'either';
        rpId: string;
    }

    export interface ExpectedAssertionResult {
        challenge: string;
        origin: string;
        factor: 'first' | 'second' | 'either';
        publicKey: string;
        prevCounter: number;
        userHandle: string;
    }

    export interface AttestationResult {
        response: {
            clientDataJSON: ArrayBuffer;
            attestationObject: ArrayBuffer;
        };
        fmt?: string;
        authData?: Buffer;
    }

    export interface AssertionResult {
        response: {
            clientDataJSON: ArrayBuffer;
            authenticatorData: ArrayBuffer;
            signature: ArrayBuffer;
            userHandle?: ArrayBuffer;
        };
        credentialId?: string;
        authenticatorData?: Buffer;
    }

    export interface Fido2AttestationResult extends AttestationResult {
        response: {
            clientDataJSON: ArrayBuffer;
            attestationObject: ArrayBuffer;
        };
        fmt?: string;
        authData?: Buffer;
    }

    export interface Fido2AssertionResult extends AssertionResult {
        response: {
            clientDataJSON: ArrayBuffer;
            authenticatorData: ArrayBuffer;
            signature: ArrayBuffer;
            userHandle?: ArrayBuffer;
        };
        credentialId?: string;
        authenticatorData?: Buffer;
    }

    export class Fido2Lib {
        constructor(options: any);
        attestationOptions(): Promise<PublicKeyCredentialCreationOptions>;
        assertionOptions(): Promise<PublicKeyCredentialRequestOptions>;
        attestationResult(
            attestation: AttestationResult,
            expectations: ExpectedAttestationResult
        ): Promise<Fido2AttestationResult>;
        assertionResult(
            assertion: AssertionResult,
            expectations: ExpectedAssertionResult
        ): Promise<Fido2AssertionResult>;
    }
}
