import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { UserMFAAttributes } from '../index/interfaces/models';
export declare class UserMFA extends Model<InferAttributes<UserMFA>, InferCreationAttributes<UserMFA>> implements UserMFAAttributes {
    id: string;
    isMfaEnabled: boolean;
    backupCodes: string[] | null;
    isEmail2faEnabled: boolean;
    isTotp2faEnabled: boolean;
    isYubicoOtp2faEnabled: boolean;
    isU2f2faEnabled: boolean;
    isPasskeyEnabled: boolean;
    totpSecret: string | null;
    yubicoOtpPublicId: string | null;
    yubicoOtpSecretKey: string | null;
    fido2CredentialId: string | null;
    fido2PublicKey: string | null;
    fido2Counter: number | null;
    fido2AttestationFormat: string | null;
    passkeyCredentialId: string | null;
    passkeyPublicKey: string | null;
    passkeyCounter: number | null;
    passkeyAttestationFormat: string | null;
}
export declare function createUserMFAModel(): Promise<typeof UserMFA | null>;
//# sourceMappingURL=UserMFA.d.ts.map