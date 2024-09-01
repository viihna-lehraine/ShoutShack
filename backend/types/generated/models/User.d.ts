import { InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { SecretsMap } from '../utils/sops';
interface UserAttributes {
    id: string;
    userid?: number;
    username: string;
    password: string;
    email: string;
    isAccountVerified: boolean;
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
    isMfaEnabled: boolean;
    creationDate: Date;
}
type UserSecrets = Pick<SecretsMap, 'PEPPER'>;
interface UserModelDependencies {
    argon2: typeof import('argon2');
    uuidv4: typeof uuidv4;
    getSecrets: () => Promise<UserSecrets>;
}
declare class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> implements UserAttributes {
    id: string;
    userid?: number;
    username: string;
    password: string;
    email: string;
    isAccountVerified: boolean;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    isMfaEnabled: boolean;
    creationDate: Date;
    comparePassword(password: string, argon2: typeof import('argon2'), secrets: UserSecrets): Promise<boolean>;
    static comparePasswordWithDependencies(hashedPassword: string, password: string, argon2: typeof import('argon2'), secrets: UserSecrets): Promise<boolean>;
    static validatePassword(password: string): boolean;
    static createUser({ argon2, uuidv4, getSecrets }: UserModelDependencies, username: string, password: string, email: string): Promise<User>;
}
export default function createUserModel(sequelize: Sequelize): typeof User;
export {};
//# sourceMappingURL=User.d.ts.map