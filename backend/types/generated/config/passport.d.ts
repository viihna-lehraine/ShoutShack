import { PassportStatic } from 'passport';
import { Logger } from './logger';
import createUserModel from '../models/User';
export interface UserInstance {
    id: string;
    username: string;
    comparePassword: (password: string, argon2: typeof import('argon2'), secrets: PassportSecrets) => Promise<boolean>;
}
interface PassportSecrets {
    JWT_SECRET: string;
    PEPPER: string;
}
interface PassportDependencies {
    readonly passport: PassportStatic;
    readonly logger: Logger;
    readonly getSecrets: () => Promise<PassportSecrets>;
    readonly UserModel: ReturnType<typeof createUserModel>;
    readonly argon2: typeof import('argon2');
}
export default function configurePassport({ passport, logger, getSecrets, UserModel, argon2 }: PassportDependencies): Promise<void>;
export {};
//# sourceMappingURL=passport.d.ts.map