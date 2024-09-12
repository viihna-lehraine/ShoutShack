import { execSync } from 'child_process';
import { Logger } from '../config/logger';
interface SopsDependencies {
    logger: Logger;
    execSync: typeof execSync;
    getDirectoryPath: () => string;
}
interface Secrets {
    [key: string]: string | number | boolean | string[] | number[] | boolean[];
}
export interface SecretsMap extends Secrets {
    APP_SSL_KEY: string;
    APP_SSL_CERT: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
    EMAIL_2FA_KEY: string;
    EMAIL_HOST: string;
    EMAIL_PORT: number;
    EMAIL_SECURE: boolean;
    FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY: boolean;
    FIDO_AUTHENTICATOR_USER_VERIFICATION: 'required' | 'preferred' | 'discouraged';
    FIDO_CHALLENGE_SIZE: number;
    FIDO_CRYPTO_PARAMETERS: number[];
    JWT_SECRET: string;
    PEPPER: string;
    RP_ID: string;
    RP_NAME: string;
    RP_ICON: string;
    SESSION_SECRET: string;
    SMTP_TOKEN: string;
    YUBICO_CLIENT_ID: number;
    YUBICO_SECRET_KEY: string;
}
declare function getSecrets({ logger, execSync, getDirectoryPath }: SopsDependencies): Promise<SecretsMap>;
declare function decryptKey({ logger, execSync }: Pick<SopsDependencies, 'logger' | 'execSync'>, encryptedFilePath: string): Promise<string>;
declare function decryptDataFiles({ logger, execSync }: Pick<SopsDependencies, 'logger' | 'execSync'>): Promise<{
    [key: string]: string;
}>;
declare function getSSLKeys(dependencies: SopsDependencies): Promise<{
    key: string;
    cert: string;
}>;
declare const _default: {
    getSecrets: typeof getSecrets;
    decryptKey: typeof decryptKey;
    decryptDataFiles: typeof decryptDataFiles;
    getSSLKeys: typeof getSSLKeys;
};
export default _default;
//# sourceMappingURL=sops.d.ts.map