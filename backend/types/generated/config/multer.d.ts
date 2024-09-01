import multer from 'multer';
import path from 'path';
export interface MulterDependencies {
    multer: typeof multer;
    path: typeof path;
    storageDir: string;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    fileSizeLimit: number;
}
export declare function createMulterUpload({ multer, path, storageDir, allowedMimeTypes, allowedExtensions, fileSizeLimit }: MulterDependencies): multer.Multer;
export default createMulterUpload;
//# sourceMappingURL=multer.d.ts.map