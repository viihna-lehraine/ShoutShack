import { execSync } from 'child_process';
import yub from 'yub';
import '../../types/custom/yub.js';
import { Logger } from '../utils/logger.js';
import getSecrets from '../environment/sops.js';
interface YubicoOtpOptions {
    clientId: number;
    apiKey: string;
    apiUrl: string;
}
interface YubicoUtilDependencies {
    yub: typeof yub;
    getSecrets: typeof getSecrets.getSecrets;
    logger: Logger;
    execSync: typeof execSync;
    getDirectoryPath: () => string;
}
export default function createYubicoOtpUtil({ yub, getSecrets, logger, execSync, getDirectoryPath }: YubicoUtilDependencies): {
    initializeYubicoOtpUtil: () => Promise<void>;
    validateYubicoOTP: (otp: string) => Promise<boolean>;
    generateYubicoOtpOptions: () => YubicoOtpOptions;
};
export {};
//# sourceMappingURL=yubicoOtpUtil.d.ts.map
