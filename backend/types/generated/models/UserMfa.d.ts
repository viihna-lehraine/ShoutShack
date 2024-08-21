import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
interface UserMfaAttributes {
    id: string;
    isMfaEnabled: boolean;
    backupCodes: string[] | null;
    isEmail2faEnabled: boolean;
    isTotpl2faEnabled: boolean;
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
declare class UserMfa extends Model<InferAttributes<UserMfa>, InferCreationAttributes<UserMfa>> implements UserMfaAttributes {
    id: string;
    isMfaEnabled: boolean;
    backupCodes: string[] | null;
    isEmail2faEnabled: boolean;
    isTotpl2faEnabled: boolean;
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
export default UserMfa;
//# sourceMappingURL=UserMfa.d.ts.map