import { Request } from 'express';
import { readFile } from 'fs/promises';
import EventEmitter from 'events';
import { FileFilterCallback, Multer } from 'multer';
import {
	EnvConfigServiceInterface,
	MulterUploadServiceInterface
} from '../index/interfaces/services';
import { ServiceFactory } from '../index/factory';
import { MulterUploadServiceDeps } from '../index/interfaces/serviceDeps';

export class MulterUploadService
	extends EventEmitter
	implements MulterUploadServiceInterface
{
	private static instance: MulterUploadService | null = null;

	private envConfig: EnvConfigServiceInterface;

	private readonly _deps: MulterUploadServiceDeps;
	public fileSizeLimit: number;
	public storageDir: string;
	public uploadDir: string;
	public allowedMimeTypes: string[];
	public allowedExtensions: string[];

	private constructor(
		envConfig: EnvConfigServiceInterface,
		deps: MulterUploadServiceDeps,
		allowedMimeTypes: string[] = [],
		allowedExtensions: string[] = []
	) {
		super();
		this.envConfig = envConfig;
		this._deps = deps;
		this.setMaxListeners(5);
		this.fileSizeLimit = this.envConfig.getEnvVariable(
			'multerFileSizeLimit'
		);
		this.storageDir = this.envConfig.getEnvVariable('multerStorageDir');
		this.uploadDir = this.envConfig.getEnvVariable('multerUploadDir');
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
				{ name: 'path', instance: deps.path }
			],
			deps.logger
		);
		this._deps.logger.info('Multer Upload Service initialized');
	}

	public static async getInstance(
		deps: MulterUploadServiceDeps,
		allowedMimeTypes: string[] = [],
		allowedExtensions: string[] = []
	): Promise<MulterUploadService> {
		if (!MulterUploadService.instance) {
			const envConfig = await ServiceFactory.getEnvConfigService();
			MulterUploadService.instance = new MulterUploadService(
				envConfig,
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
		return [
			'.bmp',
			'.gif',
			'.jpeg',
			'.jpg',
			'.mp4',
			'.pdf',
			'.png',
			'.txt',
			'.wav'
		];
	}

	public shutdown(): void {
		try {
			this.removeAllListeners();
			MulterUploadService.instance = null;
			this._deps.logger.info(
				'Multer Upload Service shutdown successfully.'
			);
		} catch (error) {
			this._deps.errorLogger.logError(
				`Error shutting down Multer Upload service: ${
					error instanceof Error ? error.message : error
				}`
			);
		}
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
