import { Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
interface MultiFactorAuthSetupAttributes {
    id: string;
    mfaId: number;
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
    id: string;
    mfaId: number;
    userId: string;
    method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
    secret: string | null;
    publicKey: string | null;
    counter: number | null;
    isActive: boolean;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
declare const MultiFactorAuthSetupModelPromise: Promise<typeof MultiFactorAuthSetup>;
export default MultiFactorAuthSetupModelPromise;
//# sourceMappingURL=MultiFactorAuthSetup.d.ts.map