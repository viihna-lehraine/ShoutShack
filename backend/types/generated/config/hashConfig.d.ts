import { Logger } from '../utils/logger';
import { SecretsMap } from '../environment/sops';
type UserSecrets = Pick<SecretsMap, 'PEPPER'>;
interface HashPasswordDependencies {
    password: string;
    secrets: UserSecrets;
    logger: Logger;
}
export declare const hashConfig: {
    type: 2;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
};
export declare function hashPassword({ password, secrets, logger }: HashPasswordDependencies): Promise<string>;
export {};
//# sourceMappingURL=hashConfig.d.ts.map
