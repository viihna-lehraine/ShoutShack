import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../utils/logger';
interface MultiFactorAuthSetupAttributes {
    mfaId: number;
    id: string;
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
    method: 'totp' | 'email' | 'yubico' | 'fido2' | 'passkey';
    secret?: string | null;
    publicKey: string | null;
    counter: number | null;
    isActive: boolean;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default function createMultiFactorAuthSetupModel(sequelize: Sequelize, logger: Logger): typeof MultiFactorAuthSetup;
export { MultiFactorAuthSetup };
//# sourceMappingURL=MultiFactorAuthSetup.d.ts.map
