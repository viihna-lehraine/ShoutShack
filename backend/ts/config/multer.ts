import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';

// Define the storage location and filename
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, '../../uploads')); // save files to 'uploads' directory
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		cb(null, `${uniqueSuffix}-${file.originalname}`);
	}
});

// File filter definition with type declarations
const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback
) => {
	const allowedMimeTypes = [
		'application/json',
		'application/x-x509-ca-cert',
		'application/pgp-keys',
		'application/pgp-signature',
		'application/xml',
		'application/x-gpg-key',
		'application/x-pkcs7-certificates',
		'audio/mp4',
		'audio/mpeg',
		'audio/ogg',
		'audio/wav',
		'audio/webm',
		'image/bmp',
		'image/jpeg',
		'image/jpg',
		'image/gif',
		'image/png',
		'image/svg+xml',
		'image/tiff',
		'image/webp',
		'text/html',
		'text/css',
		'text/csv',
		'text/markdown',
		'text/plain',
		'video/mp4',
		'video/mpeg',
		'video/quicktime',
		'video/x-msvideo'
	];

	const allowedExtensions = [
		'.avi',
		'.json',
		'.gpg',
		'.asc',
		'.xml',
		'.mp4',
		'.mp3',
		'.ogg',
		'.wav',
		'.webm',
		'.bmp',
		'.jpeg',
		'.jpg',
		'.gif',
		'.png',
		'.svg',
		'.tiff',
		'.webp',
		'.html',
		'.css',
		'.csv',
		'.md',
		'.txt',
		'.mpeg',
		'.mov',
		'.crt'
	];

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

// Set limits for the uploaded filesconst multerLimits = {
const multerLimits = {
	fileSize: 1024 * 1024 * 5
}; // Limit files to 5MB

// Create the multer instance with the storage, fileFilter, and limits
const multerConfiguredUpload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: multerLimits
});

export default multerConfiguredUpload;
