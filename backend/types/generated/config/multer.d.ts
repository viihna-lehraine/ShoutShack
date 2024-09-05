import multer, { Multer } from 'multer';
import path from 'path';
import { Logger } from './logger';
export interface MulterDependencies {
    readonly multer: typeof multer;
    readonly path: typeof path;
    readonly storageDir: string;
    readonly allowedMimeTypes: string[];
    readonly allowedExtensions: string[];
    readonly fileSizeLimit: number;
    readonly logger: Logger;
}
export declare function createMulterUpload({ multer, path, storageDir, allowedMimeTypes, allowedExtensions, fileSizeLimit, logger }: MulterDependencies): Multer;
export default createMulterUpload;
//# sourceMappingURL=multer.d.ts.map