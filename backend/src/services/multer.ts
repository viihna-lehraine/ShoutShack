import { Request } from 'express';
import { FileFilterCallback, Multer } from 'multer';
import { MulterService } from '../index/serviceInterfaces';

export function createMulterUpload({
	multer,
	path,
	storageDir,
	allowedMimeTypes,
	allowedExtensions,
	fileSizeLimit,
	appLogger,
	configService,
	errorClasses,
	ErrorSeverity,
	ErrorLogger,
	processError
	validateDependencies
}: MulterService): Multer {
	try {
		validateDependencies(
			[
				{ name: 'multer', instance: multer },
				{ name: 'path', instance: path },
				{ name: 'storageDir', instance: storageDir },
				{ name: 'allowedMimeTypes', instance: allowedMimeTypes },
				{ name: 'allowedExtensions', instance: allowedExtensions },
				{ name: 'fileSizeLimit', instance: fileSizeLimit },
				{ name: 'appLogger', instance: appLogger }
			],
			appLogger
		);

		const storage = multer.diskStorage({
			destination: (req, file, cb) => {
				cb(null, storageDir);
			},
			filename: (req, file, cb) => {
				const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
				cb(null, `${uniqueSuffix}-${file.originalname}`);
			}
		});

		const fileFilter = (
			req: Request,
			file: Express.Multer.File,
			cb: FileFilterCallback
		) => {
			const ext = path.extname(file.originalname).toLowerCase();
			if (
				allowedMimeTypes.includes(file.mimetype) &&
				allowedExtensions.includes(ext)
			) {
				cb(null, true);
			} else {
				cb(null, false);
			}
		};

		const multerLimits = {
			fileSize: fileSizeLimit
		};

		return multer({
			storage: storage,
			fileFilter: fileFilter,
			limits: multerLimits
		});
	} catch (depError) {
		const dependency: string = 'createMulterUpload()';
		const dependencyError = new errorClasses.DependencyErrorRecoverable(
			dependency,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(dependencyError);
		processError(dependencyError);
		throw dependencyError
	}
}
