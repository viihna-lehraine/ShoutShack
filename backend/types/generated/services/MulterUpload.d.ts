import EventEmitter from 'events';
import { Multer } from 'multer';
import { MulterUploadServiceInterface } from '../index/interfaces/services';
import { MulterUploadServiceDeps } from '../index/interfaces/serviceDeps';
export declare class MulterUploadService extends EventEmitter implements MulterUploadServiceInterface {
    private static instance;
    private envConfig;
    private readonly _deps;
    fileSizeLimit: number;
    storageDir: string;
    uploadDir: string;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    private constructor();
    static getInstance(deps: MulterUploadServiceDeps, allowedMimeTypes?: string[], allowedExtensions?: string[]): Promise<MulterUploadService>;
    setFileSizeLimit(limit: number): void;
    setAllowedMimeTypes(mimeTypes: string[]): void;
    setAllowedExtensions(extensions: string[]): void;
    createMulterUpload(validationCallback?: (file: Express.Multer.File) => boolean): Multer | undefined;
    onUploadSuccess(callback: (file: Express.Multer.File) => void): void;
    private isValidFile;
    private getDefaultMimeTypes;
    private getDefaultExtensions;
    shutdown(): void;
    private handleError;
}
//# sourceMappingURL=MulterUpload.d.ts.map