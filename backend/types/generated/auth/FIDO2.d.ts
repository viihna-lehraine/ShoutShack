import { AttestationResult, PublicKeyCredentialCreationOptions, PublicKeyCredentialRequestOptions, Fido2AttestationResult, Fido2AssertionResult, AssertionResult } from 'fido2-lib';
import { FIDO2ServiceInterface } from '../index/interfaces/services';
import { FidoUserInterface } from '../index/interfaces/serviceComponents';
import '../../types/custom/yub.js';
export declare class FIDO2Service implements FIDO2ServiceInterface {
    private static instance;
    private FIDO2;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private cacheService;
    private timeout;
    private constructor();
    static getInstance(): Promise<FIDO2Service>;
    initializeFIDO2Service(): Promise<void>;
    ensureInitialized(): Promise<void>;
    generateFIDO2RegistrationOptions(user: FidoUserInterface): Promise<PublicKeyCredentialCreationOptions>;
    verifyFIDO2Registration(attestation: AttestationResult, expectedChallenge: string): Promise<Fido2AttestationResult>;
    generateFIDO2AuthenticationOptions(user: FidoUserInterface): Promise<PublicKeyCredentialRequestOptions>;
    verifyAuthentication(assertion: AssertionResult, expectedChallenge: string, publicKey: string, previousCounter: number, id: string): Promise<Fido2AssertionResult>;
    invalidateFido2Cache(userId: string, action: string): Promise<void>;
    shutdown(): Promise<void>;
    private handleError;
}
//# sourceMappingURL=FIDO2.d.ts.map