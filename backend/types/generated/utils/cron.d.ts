import fs from 'fs';
import path from 'path';
import compressing from 'compressing';
import { exec } from 'child_process';
import { Logger } from 'winston';
interface CronDependencies {
    logger: Logger;
    compressing: typeof compressing;
    exec: typeof exec;
    fs: typeof fs;
    path: typeof path;
    processEnv: NodeJS.ProcessEnv;
    __dirname: string;
}
export declare function createCronJobs({ logger, compressing, exec, fs, path, processEnv, __dirname }: CronDependencies): void;
export {};
//# sourceMappingURL=cron.d.ts.map