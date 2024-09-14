import { InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../utils/logger';
interface UserMfaAttributes {
    id: string;
    isMfaEnabled: boolean;
    backupCodes?: string[] | null;
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
declare class UserMfa extends Model<InferAttributes<UserMfa>, InferCreationAttributes<UserMfa>> implements UserMfaAttributes {
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
export default function createUserMfaModel(sequelize: Sequelize, logger: Logger): typeof UserMfa;
export { UserMfa };
//# sourceMappingURL=UserMfa.d.ts.map
