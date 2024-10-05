import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { BaseRouter } from './BaseRouter';
import {
	AppLoggerServiceInterface,
	CacheServiceInterface,
	EnvConfigServiceInterface,
	ErrorHandlerServiceInterface,
	ErrorLoggerServiceInterface,
	GatekeeperServiceInterface,
	HelmetMiddlewareServiceInterface,
	JWTAuthMiddlewareServiceInterface,
	PassportAuthMiddlewareServiceInterface,
	StaticRouterInterface
} from '../index/interfaces/services';
import { FileTypeRecords } from '../index/interfaces/serviceComponents';
import { validateDependencies } from '../utils/helpers';
import { withRetry } from '../utils/helpers';
import { fileCacheTTLConfig } from '../config/cache';

export class StaticRouter extends BaseRouter implements StaticRouterInterface {
	private staticRootPath = this.envConfig.getEnvVariable('staticRootPath');

	private validCSSFiles: FileTypeRecords = {};
	private validFontFiles: FileTypeRecords = {};
	private validHTMLFiles: FileTypeRecords = {};
	private validIconFiles: FileTypeRecords = {};
	private validImageFiles: FileTypeRecords = {};
	private validJSFiles: FileTypeRecords = {};
	private validLogoFiles: FileTypeRecords = {};
	private validMDFiles: FileTypeRecords = {};
	private validTXTFiles: FileTypeRecords = {};
	private validXMLFiles: FileTypeRecords = {};

	private cssDirectory = path.join(this.staticRootPath, 'css');
	private fontDirectory = path.join(this.staticRootPath, 'assets/fonts');
	private htmlDirectory = this.staticRootPath;
	private iconDirectory = path.join(this.staticRootPath, 'assets/icons');
	private imageDirectory = path.join(this.staticRootPath, 'assets/images');
	private jsDirectory = path.join(this.staticRootPath, 'dist');
	private logoDirectory = path.join(this.staticRootPath, 'assets/logos');
	private mdDirectory = this.staticRootPath;
	private txtDirectory = this.staticRootPath;
	private xmlDirectory = this.staticRootPath;

	private forbiddenDirectories: string[] = [];
	private forbiddenExtensions: string[] = [];
	private forbiddenFiles: string[] = [];
	private validDirectories: string[] = [];
	private validExtensions: string[] = [];
	private cacheTTLs = fileCacheTTLConfig;

	private constructor(
		logger: AppLoggerServiceInterface,
		errorLogger: ErrorLoggerServiceInterface,
		errorHandler: ErrorHandlerServiceInterface,
		envConfig: EnvConfigServiceInterface,
		cacheService: CacheServiceInterface,
		gatekeeperService: GatekeeperServiceInterface,
		helmetService: HelmetMiddlewareServiceInterface,
		JWTMiddleware: JWTAuthMiddlewareServiceInterface,
		passportMiddleware: PassportAuthMiddlewareServiceInterface
	) {
		super(
			logger,
			errorLogger,
			errorHandler,
			envConfig,
			cacheService,
			gatekeeperService,
			helmetService,
			JWTMiddleware,
			passportMiddleware
		);
	}

	public async initializeStaticRouter(): Promise<void> {
		withRetry(
			async () => {
				await this.importRules();
				await this.validateConfiguration();

				const routerRules = await import('../config/routerRules');
				const validationIntervals = routerRules.validationIntervals;

				this.setUpPeriodicValidation(
					this.cssDirectory,
					this.validCSSFiles,
					this.validCSSFiles,
					['.css'],
					validationIntervals.css
				);

				this.setUpPeriodicValidation(
					this.fontDirectory,
					this.validFontFiles,
					this.validFontFiles,
					['.ttf'],
					validationIntervals.font
				);

				this.setUpPeriodicValidation(
					this.htmlDirectory,
					this.validHTMLFiles,
					this.validHTMLFiles,
					['.html'],
					validationIntervals.html
				);

				this.setUpPeriodicValidation(
					this.iconDirectory,
					this.validIconFiles,
					this.validIconFiles,
					['.png'],
					validationIntervals.icon
				);

				this.setUpPeriodicValidation(
					this.imageDirectory,
					this.validImageFiles,
					this.validImageFiles,
					['.bmp', '.jpg', '.jpeg', '.png', '.gif', '.webp'],
					validationIntervals.image
				);

				this.setUpPeriodicValidation(
					this.jsDirectory,
					this.validJSFiles,
					this.validJSFiles,
					['.js'],
					validationIntervals.js
				);

				this.setUpPeriodicValidation(
					this.logoDirectory,
					this.validLogoFiles,
					this.validLogoFiles,
					['.svg'],
					validationIntervals.logo
				);

				this.setUpPeriodicValidation(
					this.mdDirectory,
					this.validMDFiles,
					this.validMDFiles,
					['.md'],
					validationIntervals.md
				);

				this.setUpPeriodicValidation(
					this.txtDirectory,
					this.validTXTFiles,
					this.validTXTFiles,
					['.txt'],
					validationIntervals.txt
				);

				this.setUpPeriodicValidation(
					this.xmlDirectory,
					this.validXMLFiles,
					this.validXMLFiles,
					['.xml'],
					validationIntervals.xml
				);
			},
			5,
			1000
		);
	}

	private async importRules(): Promise<void> {
		try {
			const routerRules = await import('../config/routerRules');

			this.forbiddenDirectories = routerRules.forbiddenDirectories;
			this.forbiddenExtensions = routerRules.forbiddenExtensions;
			this.forbiddenFiles = routerRules.forbiddenFiles;
			this.validDirectories = routerRules.validDirectories;
			this.validExtensions = routerRules.validExtensions;
			this.validCSSFiles = routerRules.validCSSFiles;
			this.validFontFiles = routerRules.validFontFiles;
			this.validHTMLFiles = routerRules.validHTMLFiles;
			this.validMDFiles = routerRules.validMDFiles;
			this.validTXTFiles = routerRules.validTXTFiles;
			this.validXMLFiles = routerRules.validXMLFiles;

			this.logger.info('Static Router rules imported successfully');
		} catch (error) {
			this.logger.error(
				`Failed to import router rules\n${Error instanceof Error ? error : 'Unknown error'}`
			);
		}
	}

	private async validateConfiguration(): Promise<void> {
		validateDependencies(
			[{ name: 'staticRootPath', instance: this.staticRootPath }],
			this.logger
		);

		if (!this.staticRootPath || typeof this.staticRootPath !== 'string') {
			throw new this.errorHandler.ErrorClasses.ConfigurationError(
				'Invalid staticRootPath: must be a non-empty string',
				{ exposeToClient: false }
			);
		}

		await withRetry(() => this.importRules(), 3, 1000);
	}

	public async handleRequest(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const filePath = path.join(this.staticRootPath, req.path);

		if (req.path === '/') {
			await this.serveIndexFile(req, res, next);
		} else {
			await this.serveStaticFile(filePath, req.path, req, res, next);
		}
	}

	// *DEV-NOTE* this should work with Gatekeeper to track any IP that is making directory traversal attempts and act accordingly
	private async serveStaticFile(
		filePath: string,
		route: string,
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const cacheKey = this.getCacheKey(route);
		const fileExtension = path.extname(filePath);
		const cacheTTL = this.getCacheTTL(fileExtension);

		await withRetry(
			async () => {
				await this.blockForbiddenFiles(req, res, next);

				const cachedFile = await this.cacheService.get<string>(
					cacheKey,
					'static-files'
				);

				if (cachedFile) {
					this.logger.info(`Serving file from cache: ${cacheKey}`);
					res.send(cachedFile);
					return;
				}

				const resolvedPath = path.resolve(filePath);
				const allowedPath = path.resolve(this.staticRootPath);

				if (!resolvedPath.startsWith(allowedPath)) {
					this.logger.warn(
						`Attempted directory traversal by ${req.ip} to ${req.url}`
					);
					res.status(403).json({ message: 'Access denied' });
					return;
				}

				const ext = path.extname(resolvedPath);
				let serveFunction: (
					req: Request,
					res: Response,
					next: NextFunction
				) => Promise<void>;

				switch (ext) {
					case '.html':
						serveFunction = this.serveHTMLFile.bind(this);
						break;
					case '.css':
						serveFunction = this.serveCSSFile.bind(this);
						break;
					case '.js':
						serveFunction = this.serveJSFile.bind(this);
						break;
					case '.ico':
						serveFunction = this.serveIconFile.bind(this);
						break;
					case '.png':
					case '.jpg':
					case '.jpeg':
					case '.gif':
						serveFunction = this.serveImageFile.bind(this);
						break;
					case '.webp':
						serveFunction = this.serveLogoFile.bind(this);
						break;
					case '.md':
						serveFunction = this.serveMDFile.bind(this);
						break;
					case '.txt':
						serveFunction = this.serveTXTFile.bind(this);
						break;
					case '.xml':
						serveFunction = this.serveXMLFile.bind(this);
						break;
					default:
						serveFunction = this.serveNotFoundPage.bind(this);
				}

				try {
					await serveFunction(req, res, next);

					const fileContent =
						await this.readFileContent(resolvedPath);
					await this.cacheService.set(
						cacheKey,
						fileContent,
						'static-files',
						cacheTTL
					);

					this.logger.debug(
						`Served and cached static file: ${route} with TTL: ${cacheTTL} seconds`
					);
				} catch (error) {
					this.errorLogger.logError(
						`Error serving static file ${route}: ${
							error instanceof Error
								? error.message
								: 'Unknown error'
						}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${route} not found`,
						statusCode: 404,
						res
					});
					next(error);
				}
			},
			3,
			500
		);
	}

	private getCacheTTL(fileExtension: string): number {
		return this.cacheTTLs[fileExtension] || this.cacheTTLs['default'];
	}

	private getCacheKey(route: string): string {
		return `static:${route}`;
	}

	private async readFileContent(filePath: string): Promise<string> {
		return await fs.readFile(filePath, 'utf8');
	}

	private async serveIndexFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const indexFile = this.validHTMLFiles['index'];

		if (typeof indexFile !== 'string') {
			this.logger.warn(`Index page not found or invalid`);
			res.status(404).json({ message: 'Index page not found' });
			return;
		}

		const filePath = path.join(this.staticRootPath, indexFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving index file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served index file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	public async serveNotFoundPage(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const notFoundPage = this.validHTMLFiles['notFound'];

		if (typeof notFoundPage !== 'string') {
			this.logger.warn(`not-found.html file is missing`);
			res.status(404).json({ message: 'Page not found' });
			return;
		}

		const filePath = path.join(this.staticRootPath, notFoundPage);
		await this.serveStaticFile(filePath, 'not-found', req, res, next);
	}

	private async serveCSSFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const cssFile = req.params.file;

		if (typeof cssFile !== 'string') {
			this.logger.warn(
				`CSS file not found or invalid: ${req.params.filename}`
			);
		}

		const filePath = path.join(this.cssDirectory, cssFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving CSS file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served CSS file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveHTMLFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const page = req.params.page;
		const filePathEntry = this.validHTMLFiles[page];

		if (typeof filePathEntry !== 'string') {
			this.logger.warn(`HTML page not found: ${page}`);
			await this.serveNotFoundPage(req, res, next);
			return;
		}

		const filePath = path.join(this.staticRootPath, filePathEntry);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, async error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving HTML file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					await this.serveNotFoundPage(req, res, next);
					reject(error);
					next(error);
				} else {
					this.logger.debug(`Served HTML file: ${filePath}`);
					resolve();
					next();
				}
			});
		});
	}

	private async serveIconFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Icon file not found or invalid: ${req.params.filename}`
			);

			res.status(404).json({ message: 'Logo file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving icon file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served icon file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveImageFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving image file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served image file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveJSFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Javascript file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Javascript file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving javascript file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served javascript file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveLogoFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const imageFile = this.validImageFiles[req.params.filename];

		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}

		const filePath = path.join(this.imageDirectory, imageFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving image file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served logo file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveMDFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const jsFile = this.validJSFiles[req.params.filename];

		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Markdown file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Markdown file not found' });
			return;
		}

		const filePath = path.join(this.jsDirectory, jsFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving markdown file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served markdown file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveTXTFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const jsFile = this.validJSFiles[req.params.filename];

		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Text file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}

		const filePath = path.join(this.jsDirectory, jsFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving text file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served text file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private async serveXMLFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const jsFile = this.validJSFiles[req.params.filename];

		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`XML file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}

		const filePath = path.join(this.jsDirectory, jsFile);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving XML file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served XML file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private validateFiles(
		directory: string,
		fileRecord: FileTypeRecords,
		allowedFiles: FileTypeRecords,
		validExtensions: string[]
	): void {
		try {
			const validFiles = Object.keys(allowedFiles);
			const filesInDirectory = Object.keys(fileRecord);

			filesInDirectory.forEach(file => {
				const filePaths = Array.isArray(fileRecord[file])
					? fileRecord[file]
					: [fileRecord[file]];

				filePaths.forEach(filePath => {
					const ext = path.extname(filePath as string);

					if (
						!validFiles.includes(filePath as string) ||
						!validExtensions.includes(ext)
					) {
						this.logger.warn(
							`Invalid or forbidden file detected in ${directory}: ${filePath}`
						);
					}
				});
			});

			this.logger.info(`Validation completed for ${directory}`);
		} catch (error) {
			this.logger.error(
				`Error validating files in directory ${directory}: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	private setUpPeriodicValidation(
		directory: string,
		fileRecord: FileTypeRecords,
		allowedFiles: FileTypeRecords,
		validExtensions: string[],
		intervalMs: number
	): void {
		try {
			this.validateFiles(
				directory,
				fileRecord,
				allowedFiles,
				validExtensions
			);

			setInterval(() => {
				this.validateFiles(
					directory,
					fileRecord,
					allowedFiles,
					validExtensions
				);
				this.logger.info(
					`Periodic validation completed for ${directory}`
				);
			}, intervalMs);
		} catch (error) {
			this.logger.error(
				`Error setting up periodic validation for directory ${directory}: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}

	private async blockForbiddenFiles(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const filePath = path.normalize(req.url);
		const resolvedPath = path.resolve(this.staticRootPath, filePath);
		const isForbiddenDirectory = this.forbiddenDirectories.some(dir =>
			resolvedPath.includes(path.resolve(this.staticRootPath, dir))
		);

		if (isForbiddenDirectory) {
			this.logger.warn(
				`Attempted access to forbidden directory: ${req.url}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		const isValidDirectory = this.validDirectories.some(dir =>
			resolvedPath.includes(path.resolve(this.staticRootPath, dir))
		);

		if (!isValidDirectory) {
			this.logger.warn(
				`Attempted access to invalid directory: ${req.url}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		const filename = path.basename(filePath);
		const fileExt = path.extname(filename);

		if (this.forbiddenFiles.includes(filename)) {
			this.logger.warn(`Attempted access to forbidden file: ${filename}`);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		if (this.forbiddenExtensions.includes(fileExt)) {
			this.logger.warn(
				`Attempted access to forbidden file extension: ${fileExt}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		const isValidExtension = this.validExtensions.includes(fileExt);

		if (!isValidExtension) {
			this.logger.warn(
				`Attempted access to invalid file extension: ${fileExt}`
			);
			res.status(403).json({ message: 'Access denied' });

			return;
		}

		next();
	}
}
