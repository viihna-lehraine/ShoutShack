import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { RateLimitMiddlewareDependencies } from '../middleware/rateLimit';
import { SecretsMap } from '../environment/sops';
interface UserAttributes {
    id: string;
    userId: number;
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
    userId: number;
    username: string;
    password: string;
    email: string;
    isAccountVerified: boolean;
    resetPasswordToken: string | null;
    resetPasswordExpires: Date | null;
    isMfaEnabled: boolean;
    creationDate: CreationOptional<Date>;
    comparePassword(password: string, argon2: typeof import('argon2'), secrets: UserSecrets, logger: Logger): Promise<boolean>;
    static validatePassword(password: string, logger: Logger): boolean;
    static createUser({ uuidv4, getSecrets }: UserModelDependencies, userId: number, username: string, password: string, email: string, rateLimitDependencies: RateLimitMiddlewareDependencies, logger: Logger): Promise<User>;
    static comparePasswords(hashedPassword: string, password: string, argon2: typeof import('argon2'), secrets: UserSecrets, logger: Logger): Promise<boolean>;
}
export default function createUserModel(sequelize: Sequelize, logger: Logger): typeof User;
export { User };
//# sourceMappingURL=User.d.ts.map
