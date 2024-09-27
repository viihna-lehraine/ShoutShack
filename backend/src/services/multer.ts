import { Request } from 'express';
import { readFile } from 'fs/promises';
import EventEmitter from 'events';
import { FileFilterCallback, Multer } from 'multer';
import {
	MulterUploadServiceDeps,
	MulterUploadServiceInterface
} from '../index/interfaces';

export class MulterUploadService
	extends EventEmitter
	implements MulterUploadServiceInterface
{
	private static instance: MulterUploadService | null = null;
	private readonly _deps: MulterUploadServiceDeps;
	public fileSizeLimit: number;
	public storageDir: string;
	public uploadDir: string;
	public allowedMimeTypes: string[];
	public allowedExtensions: string[];

	private constructor(
		deps: MulterUploadServiceDeps,
		allowedMimeTypes: string[] = [],
		allowedExtensions: string[] = []
	) {
		super();
		this._deps = deps;
		this.setMaxListeners(5);
		this.fileSizeLimit = deps.configService.getEnvVariable(
			'multerFileSizeLimit'
		);
		this.storageDir = deps.configService.getEnvVariable('multerStorageDir');
		this.uploadDir = deps.configService.getEnvVariable('multerUploadDir');
		this.allowedMimeTypes =
			allowedMimeTypes.length > 0
				? allowedMimeTypes
				: this.getDefaultMimeTypes();
		this.allowedExtensions =
			allowedExtensions.length > 0
				? allowedExtensions
				: this.getDefaultExtensions();

		deps.validateDependencies(
			[
				{ name: 'multer', instance: deps.multer },
				{
					name: 'fileTypeFromBuffer',
					instance: deps.fileTypeFromBuffer
				},
				{ name: 'fs', instance: deps.fs },
				{ name: 'path', instance: deps.path },
				{ name: 'configService', instance: deps.configService }
			],
			deps.logger
		);
		this._deps.logger.info('Multer Upload Service initialized');
	}

	public static getInstance(
		deps: MulterUploadServiceDeps,
		allowedMimeTypes: string[] = [],
		allowedExtensions: string[] = []
	): MulterUploadService {
		if (!MulterUploadService.instance) {
			MulterUploadService.instance = new MulterUploadService(
				deps,
				allowedMimeTypes,
				allowedExtensions
			);
		}
		return MulterUploadService.instance;
	}

	public setFileSizeLimit(limit: number): void {
		if (limit <= 0) {
			throw new Error('File size limit must be greater than zero');
		}
		this.fileSizeLimit = limit;
		this._deps.logger.info(`File size limit set to ${limit} bytes`);
	}

	public setAllowedMimeTypes(mimeTypes: string[]): void {
		if (!mimeTypes.every(mimeType => typeof mimeType === 'string')) {
			throw new Error('Invalid MIME types provided');
		}
		this.allowedMimeTypes = mimeTypes;
		this._deps.logger.info(`Allowed MIME types updated\n${mimeTypes}`);
	}

	public setAllowedExtensions(extensions: string[]): void {
		if (!extensions.every(ext => typeof ext === 'string')) {
			throw new Error('Invalid file extensions provided');
		}
		this.allowedExtensions = extensions;
		this._deps.logger.info(`Allowed extensions updated\n${extensions}`);
	}

	public createMulterUpload(
		validationCallback?: (file: Express.Multer.File) => boolean
	): Multer | undefined {
		try {
			const storage = this._deps.multer.diskStorage({
				destination: (req, file, cb) => {
					this._deps.logger.info(
						`Storing file in: ${this.storageDir}`
					);
					cb(null, this.storageDir);
				},
				filename: (req, file, cb) => {
					const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
					this._deps.logger.info(
						`File ${file.originalname} will be saved as: ${uniqueSuffix}-${file.originalname}`
					);
					cb(null, `${uniqueSuffix}-${file.originalname}`);
				}
			});

			const fileFilter = async (
				req: Request,
				file: Express.Multer.File,
				cb: FileFilterCallback
			): Promise<void> => {
				const ext = this._deps.path
					.extname(file.originalname)
					.toLowerCase();
				const isValid = await this.isValidFile(file, ext);

				const isValidationPassed = validationCallback
					? validationCallback(file)
					: true;

				if (isValid && isValidationPassed) {
					this.emit('uploadAccepted', file);
					this._deps.logger.info(
						`File accepted: ${file.originalname}`
					);
					cb(null, true);
				} else {
					this.emit('uploadRejected', file);
					this._deps.logger.warn(
						`File rejected: ${file.originalname}`
					);
					cb(null, false);
				}
			};

			return this._deps.multer({
				storage,
				fileFilter,
				limits: { fileSize: this.fileSizeLimit }
			});
		} catch (depError) {
			this.handleError(
				'Unable to create Multer Upload instance',
				depError || Error || 'Unknown error'
			);
			return undefined;
		}
	}

	public onUploadSuccess(
		callback: (file: Express.Multer.File) => void
	): void {
		this.once('uploadAccepted', callback);
	}

	private async isValidFile(
		file: Express.Multer.File,
		ext: string
	): Promise<boolean> {
		const isMimeValid = this.allowedMimeTypes.includes(file.mimetype);
		const isExtensionValid = this.allowedExtensions.includes(ext);

		const buffer = await readFile(file.path);
		const fileType = await this._deps.fileTypeFromBuffer(buffer);

		const isContentValid = fileType
			? this.allowedMimeTypes.includes(fileType.mime)
			: false;

		const result = isMimeValid && isExtensionValid && isContentValid;

		this._deps.logger.info(
			`File validation result for ${file.originalname}: ${result}`
		);
		return isMimeValid && isExtensionValid && isContentValid;
	}

	private getDefaultMimeTypes(): string[] {
		return [
			'image/jpeg',
			'image/png',
			'image/gif',
			'video/mp4',
			'application/pdf',
			'text/plain'
		];
	}

	private getDefaultExtensions(): string[] {
		return ['.jpeg', '.jpg', '.png', '.gif', '.mp4', '.pdf', '.txt'];
	}

	private handleError(message: string, error: unknown): void {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		const dependencyError =
			new this._deps.errorHandler.ErrorClasses.DependencyErrorFatal(
				`${message}: ${errorMessage}`,
				{ exposeToClient: false }
			);
		this._deps.errorLogger.logError(dependencyError.message);
		this._deps.errorHandler.handleError({ error: dependencyError });
		throw dependencyError;
	}
}
