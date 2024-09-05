import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Logger } from '../config/logger';
interface Secrets {
    EMAIL_2FA_KEY: string;
}
interface Email2FAUtilDependencies {
    logger: Logger;
    getSecrets: () => Promise<Secrets>;
    bcrypt: typeof bcrypt;
    jwt: typeof jwt;
}
export default function createEmail2FAUtil({ logger, getSecrets, bcrypt, jwt }: Email2FAUtilDependencies): Promise<{
    generateEmail2FACode: () => Promise<{
        email2FACode: string;
        email2FAToken: string;
    }>;
    verifyEmail2FACode: (token: string, email2FACode: string) => Promise<boolean>;
}>;
export {};
//# sourceMappingURL=email2FAUtil.d.ts.map