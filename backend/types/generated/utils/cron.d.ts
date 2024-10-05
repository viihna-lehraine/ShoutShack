import { exec } from 'child_process';
import compressing from 'compressing';
import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
export interface CronInterface {
    compressing: typeof compressing;
    exec: typeof exec;
    fs: typeof fs;
    path: typeof path;
    processEnv: NodeJS.ProcessEnv;
    sequelize: Sequelize;
    __dirname: string;
}
export declare function createCronJobs({ compressing, exec, fs, path, processEnv, sequelize }: CronInterface): Promise<void>;
//# sourceMappingURL=cron.d.ts.map