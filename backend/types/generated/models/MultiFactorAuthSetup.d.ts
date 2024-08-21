import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
interface MultiFactorAuthSetupAttributes {
    mfaId: number;
    id: string;
    userId: string;
    method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
    secret?: string | null;
    publicKey?: string | null;
    counter?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare class MultiFactorAuthSetup extends Model<InferAttributes<MultiFactorAuthSetup>, InferCreationAttributes<MultiFactorAuthSetup>> implements MultiFactorAuthSetupAttributes {
    mfaId: number;
    id: string;
    userId: string;
    method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
    secret: string | null;
    publicKey: string | null;
    counter: number | null;
    isActive: boolean;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default MultiFactorAuthSetup;
//# sourceMappingURL=MultiFactorAuthSetup.d.ts.map