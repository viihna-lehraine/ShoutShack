import { Request } from 'express';
import { FileFilterCallback, Multer } from 'multer';
import { MulterServiceInterface } from '../index/interfaces';

export class MulterService {
	private multer: Multer;
	private path: typeof import('path');
	private storageDir: string;
	private allowedMimeTypes: string[];
	private allowedExtensions: string[];
	private fileSizeLimit: number;
	private appLogger: AppLogger;
	private errorLogger: ErrorLogger;
	private configService: ConfigService;

	constructor({
		multer,
		path,
		storageDir,
		allowedMimeTypes,
		allowedExtensions,
		fileSizeLimit,
		appLogger,
		configService,
		errorLogger,
		errorClasses,
		ErrorSeverity,
		processError,
		validateDependencies
	}: MulterServiceInterface) {
		this.multer = multer;
		this.path = path;
		this.storageDir = storageDir;
		this.allowedMimeTypes = allowedMimeTypes;
		this.allowedExtensions = allowedExtensions;
		this.fileSizeLimit = fileSizeLimit;
		this.appLogger = appLogger;
		this.errorLogger = errorLogger;
		this.configService = configService;

		// Validate dependencies on initialization
		this.validateDependencies(validateDependencies);
	}

	// Validation of dependencies
	private validateDependencies(validateDependencies: any): void {
		validateDependencies(
			[
				{ name: 'multer', instance: this.multer },
				{ name: 'path', instance: this.path },
				{ name: 'storageDir', instance: this.storageDir },
				{ name: 'allowedMimeTypes', instance: this.allowedMimeTypes },
				{ name: 'allowedExtensions', instance: this.allowedExtensions },
				{ name: 'fileSizeLimit', instance: this.fileSizeLimit },
				{ name: 'appLogger', instance: this.appLogger }
			],
			this.appLogger
		);
	}

	// Create a new Multer instance
	public createMulterUpload(): Multer {
		try {
			// Define the disk storage
			const storage = this.multer.diskStorage({
				destination: (req, file, cb) => {
					cb(null, this.storageDir);
				},
				filename: (req, file, cb) => {
					const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
					cb(null, `${uniqueSuffix}-${file.originalname}`);
				}
			});

			// Define the file filter
			const fileFilter = (
				req: Request,
				file: Express.Multer.File,
				cb: FileFilterCallback
			) => {
				const ext = this.path.extname(file.originalname).toLowerCase();
				if (
					this.allowedMimeTypes.includes(file.mimetype) &&
					this.allowedExtensions.includes(ext)
				) {
					cb(null, true);
				} else {
					this.appLogger.warn(`File rejected: ${file.originalname}`);
					cb(null, false);
				}
			};

			// Define Multer limits
			const multerLimits = {
				fileSize: this.fileSizeLimit
			};

			// Create the Multer instance
			return this.multer({
				storage: storage,
				fileFilter: fileFilter,
				limits: multerLimits
			});
		} catch (depError) {
			const dependency = 'createMulterUpload()';
			const dependencyError = new AppError(
				`Error in ${dependency}: ${depError instanceof Error ? depError.message : depError}`,
				500
			);
			this.errorLogger.logError(dependencyError);
			throw dependencyError;
		}
	}
}
