import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { UserAttributesInterface } from '../index/interfaces/models';
export declare class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> implements UserAttributesInterface {
    id: string;
    userId?: number;
    username: string;
    password: string;
    email: string;
    isVerified: boolean;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    isMFAEnabled: boolean;
    totpSecret?: string | null | undefined;
    emailMFASecret?: string | null | undefined;
    emailMFAToken?: string | null | undefined;
    emailMFATokenExpires?: Date | null | undefined;
    creationDate: CreationOptional<Date>;
    static initializeModel(sequelize: Sequelize): void;
}
export declare function createUserModel(): Promise<typeof User>;
//# sourceMappingURL=User.d.ts.map