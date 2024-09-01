import { PassportStatic } from 'passport';
import createUserModel from '../models/User';
interface PassportSecrets {
    JWT_SECRET: string;
    PEPPER: string;
}
interface PassportDependencies {
    passport: PassportStatic;
    logger: ReturnType<typeof import('./logger').default>;
    getSecrets: () => Promise<PassportSecrets>;
    UserModel: ReturnType<typeof createUserModel>;
    argon2: typeof import('argon2');
}
export default function configurePassport({ passport, logger, getSecrets, UserModel, argon2 }: PassportDependencies): Promise<void>;
export {};
//# sourceMappingURL=passport.d.ts.map