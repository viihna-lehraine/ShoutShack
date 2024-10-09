import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { MFASetupAttributes } from '../index/interfaces/models';
export declare class MFASetup extends Model<InferAttributes<MFASetup>, InferCreationAttributes<MFASetup>> implements MFASetupAttributes {
    mfaId: number;
    id: string;
    method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
    secret?: string | null;
    publicKey: string | null;
    counter: number | null;
    isActive: boolean;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export declare function createMFASetupModel(): Promise<typeof MFASetup | null>;
//# sourceMappingURL=MFASetup.d.ts.map