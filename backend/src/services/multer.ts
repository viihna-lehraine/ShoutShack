import { Request } from 'express';
import EventEmitter from 'events';
import { FileFilterCallback, Multer } from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { readFile } from 'fs/promises';
import {
	AppLoggerInterface,
	ErrorHandlerInterface,
	MulterUploadServiceDeps,
	MulterUploadServiceInterface
} from '../index/interfaces';

export class MulterUploadService
	extends EventEmitter
	implements MulterUploadServiceInterface
{
	private static instance: MulterUploadService | null = null;
	private multer: typeof import('multer');
	private path: typeof import('path');
	private configService: typeof import('../services/configService').configService;
	private logger: AppLoggerInterface;
	private errorLogger: AppLoggerInterface;
	private errorHandler: ErrorHandlerInterface;
	private fileSizeLimit: number;
	private storageDir: string;
	private uploadDir: string;
	private allowedMimeTypes: string[];
	private allowedExtensions: string[];

	constructor({
		multer,
		path,
		configService,
		validateDependencies,
		logger,
		errorLogger,
		errorHandler,
		allowedMimeTypes = [],
		allowedExtensions = []
	}: MulterUploadServiceDeps) {
		super();
		this.setMaxListeners(5);

		this.multer = multer;
		this.path = path;
		this.configService = configService;
		this.logger = logger;
		this.errorLogger = errorLogger;
		this.errorHandler = errorHandler;
		this.fileSizeLimit =
			configService.getEnvVariables().multerFileSizeLimit;
		this.storageDir = configService.getEnvVariables().multerStorageDir;
		this.uploadDir = configService.getEnvVariables().multerUploadDir;
		this.allowedMimeTypes =
			allowedMimeTypes.length > 0
				? allowedMimeTypes
				: this.getDefaultMimeTypes();
		this.allowedExtensions =
			allowedExtensions.length > 0
				? allowedExtensions
				: this.getDefaultExtensions();

		validateDependencies(
			[
				{ name: 'multer', instance: this.multer },
				{ name: 'path', instance: this.path },
				{ name: 'configService', instance: this.configService },
				{ name: 'allowedMimeTypes', instance: this.allowedMimeTypes },
				{ name: 'allowedExtensions', instance: this.allowedExtensions }
			],
			logger
		);
	}

	public static getInstance(
		deps: MulterUploadServiceDeps
	): MulterUploadService {
		if (!MulterUploadService.instance) {
			deps.validateDependencies(
				[
					{ name: 'multer', instance: deps.multer },
					{ name: 'path', instance: deps.path },
					{
						name: 'allowedMimeTypes',
						instance: deps.allowedMimeTypes || []
					},
					{
						name: 'allowedExtensions',
						instance: deps.allowedExtensions || []
					}
				],
				deps.logger
			);

			MulterUploadService.instance = new MulterUploadService(deps);
		}
		return MulterUploadService.instance;
	}

	public setFileSizeLimit(limit: number): void {
		if (limit <= 0) {
			throw new Error('File size limit must be greater than zero');
		}
		this.fileSizeLimit = limit;
	}

	public setAllowedMimeTypes(mimeTypes: string[]): void {
		if (!mimeTypes.every(mimeType => typeof mimeType === 'string')) {
			throw new Error('Invalid MIME types provided');
		}
		this.allowedMimeTypes = mimeTypes;
	}

	public setAllowedExtensions(extensions: string[]): void {
		if (!extensions.every(ext => typeof ext === 'string')) {
			throw new Error('Invalid file extensions provided');
		}
		this.allowedExtensions = extensions;
	}

	public createMulterUpload(
		validationCallback?: (file: Express.Multer.File) => boolean
	): Multer {
		try {
			const storage = this.multer.diskStorage({
				destination: (req, file, cb) => {
					this.logger.info(`Storing file in: ${this.storageDir}`);
					cb(null, this.storageDir);
				},
				filename: (req, file, cb) => {
					const uniqueSuffix = `${Date.now()}-${Math.round(
						Math.random() * 1e9
					)}`;
					this.logger.info(
						`File ${file.originalname} will be saved as: ${uniqueSuffix}-${file.originalname} and stored in ${this.uploadDir}`
					);
					cb(null, `${uniqueSuffix}-${file.originalname}`);
				}
			});

			const fileFilter = async (
				req: Request,
				file: Express.Multer.File,
				cb: FileFilterCallback
			): Promise<void> => {
				const ext = this.path.extname(file.originalname).toLowerCase();

				const isValid = await this.isValidFile(file, ext);

				const isValidationPassed = validationCallback
					? validationCallback(file)
					: true;

				if (isValid && isValidationPassed) {
					this.emit('uploadAccepted', file);
					this.logger.info(`File accepted: ${file.originalname}`);
					cb(null, true);
				} else {
					this.emit('uploadRejected', file);
					this.logger.warn(`File rejected: ${file.originalname}`);
					cb(null, false);
				}
			};

			const multerLimits = {
				fileSize: this.fileSizeLimit
			};

			return this.multer({
				storage,
				fileFilter,
				limits: multerLimits
			});
		} catch (depError) {
			const dependencyError =
				new this.errorHandler.ErrorClasses.DependencyErrorFatal(
					`Fatal error: Unable to create Multer Upload instance: ${depError instanceof Error ? depError.message : depError}`,
					{ exposeToClient: false }
				);
			this.errorLogger.logError(dependencyError.message);
			this.errorHandler.handleError({
				error:
					dependencyError ||
					depError ||
					Error ||
					'Multer Upload Service: Unknown error'
			});
			throw dependencyError;
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
		const fileType = await fileTypeFromBuffer(buffer);

		const isContentValid = fileType
			? this.allowedMimeTypes.includes(fileType.mime)
			: false;

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
}
