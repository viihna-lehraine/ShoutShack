import { Request } from 'express';
import multer, { FileFilterCallback, Multer } from 'multer';
import path from 'path';

export interface MulterDependencies {
	readonly multer: typeof multer;
	readonly path: typeof path;
	readonly storageDir: string;
	readonly allowedMimeTypes: string[];
	readonly allowedExtensions: string[];
	readonly fileSizeLimit: number;
}

export function createMulterUpload({
	multer,
	path,
	storageDir,
	allowedMimeTypes,
	allowedExtensions,
	fileSizeLimit
}: MulterDependencies): Multer {
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
}

export default createMulterUpload;
