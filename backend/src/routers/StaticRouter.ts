import { NextFunction, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { BaseRouter } from './BaseRouter';
import { FileTypeRecords, StaticRouterInterface } from '../index/interfaces';
import { validateDependencies } from '../utils/helpers';
import { withRetry } from '../utils/helpers';

export class StaticRouter extends BaseRouter implements StaticRouterInterface {
	private static instance: StaticRouter | null = null;

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

	private validCSSFilesFromScan: FileTypeRecords = {};
	private validFontFilesFromScan: FileTypeRecords = {};
	private validHTMLFilesFromScan: FileTypeRecords = {};
	private validIconFilesFromScan: FileTypeRecords = {};
	private validImageFilesFromScan: FileTypeRecords = {};
	private validJSFilesFromScan: FileTypeRecords = {};
	private validLogoFilesFromScan: FileTypeRecords = {};
	private validMDFilesFromScan: FileTypeRecords = {};
	private validTXTFilesFromScan: FileTypeRecords = {};
	private validXMLFilesFromScan: FileTypeRecords = {};

	private cssDirectory = path.join(this.staticRootPath, 'css');
	private fontDirectory = path.join(this.staticRootPath, 'assets/fonts');
	private htmlDirectory = this.staticRootPath;
	private iconDirectory = path.join(this.staticRootPath, 'assets/icons');
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

	private constructor() {
		super();
	}

	public static async getInstance(): Promise<StaticRouter> {
		if (!StaticRouter.instance) {
			StaticRouter.instance = new StaticRouter();

			await StaticRouter.instance.initializeStaticRouter();
		}

		return StaticRouter.instance;
	}

	public async initializeStaticRouter(): Promise<void> {
		withRetry(
			async () => {
				await this.importRules();
				await this.validateConfiguration();
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

	// *DEV-NOTE* this should work with Gatekeeper to track any IP that is making directory traversal attempts and act accordingly
	private async serveStaticFile(
		filePath: string,
		route: string,
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		await withRetry(
			async () => {
				await this.blockForbiddenFiles(req, res, next);

				const resolvedPath = path.resolve(filePath);
				const allowedPath = path.resolve(this.staticRootPath);

				if (!resolvedPath.startsWith(allowedPath)) {
					this.logger.warn(
						`Attempted directory traversal by ${req.ip} to ${req.url}`
					);
					res.status(403).json({ message: 'Access denied' });
					return;
				}

				return new Promise<void>((resolve, reject) => {
					res.sendFile(resolvedPath, error => {
						if (error) {
							this.errorLogger.logError(
								`Error serving static file ${route}: ${
									error instanceof Error
										? error.message
										: 'Unknown error'
								}`
							);
							this.errorHandler.sendClientErrorResponse({
								message: `${resolvedPath} not found`,
								statusCode: 404,
								res
							});
							reject(error);
							next(error);
						} else {
							this.logger.debug(`Served static file: ${route}`);
							resolve();
							next();
						}
					});
				});
			},
			3,
			500
		);
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

	private async serveHTMLFile(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const page = req.params.page;
		const filePathEntry = this.validHTMLFiles[page];

		if (typeof filePathEntry !== 'string') {
			this.logger.warn(
				`Attempt to access invalid or non-string page: ${page}`
			);
			res.status(404).json({ message: 'Page not found' });
			return;
		}

		const filePath = path.join(this.staticRootPath, filePathEntry);

		return new Promise<void>((resolve, reject) => {
			res.sendFile(filePath, error => {
				if (error) {
					this.errorLogger.logError(
						`Error serving static file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					this.errorHandler.sendClientErrorResponse({
						message: `${filePath} not found`,
						statusCode: 404,
						res
					});
					reject(error);
					return next(error);
				} else {
					this.logger.debug(`Served static file: ${filePath}`);
					resolve();
					return next();
				}
			});
		});
	}

	private watchDirectory(
		directory: string,
		fileRecord: FileTypeRecords,
		validExtensions: string[]
	): void {
		try {
			this.scanDirectory(directory, fileRecord, validExtensions);

			watch(directory, (eventType, filename) => {
				if (filename) {
					const ext = path.extname(filename);
					if (validExtensions.includes(ext)) {
						this.scanDirectory(
							directory,
							fileRecord,
							validExtensions
						);
						this.logger.info(
							`File change detected in ${directory}: ${filename}`
						);
					}
				}
			});
		} catch (error) {
			this.logger.error(
				`Error watching directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async scanDirectory(
		directory: string,
		fileRecord: FileTypeRecords,
		validExtensions: string[]
	): Promise<void> {
		try {
			const files = await fs.readdir(directory);
			const validFiles: FileTypeRecords = {};

			files.forEach(file => {
				const ext = path.extname(file);
				if (validExtensions.includes(ext)) {
					const fileName = path.basename(file, ext);
					validFiles[fileName] = file;
				}
			});

			Object.assign(fileRecord, validFiles);
		} catch (error) {
			this.logger.error(
				`Error scanning directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private async blockForbiddenFiles(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const filePath = path.normalize(req.url);
		const resolvedPath = path.resolve(filePath);
		const isForbiddenDirectory = this.forbiddenDirectories.some(dir =>
			resolvedPath.includes(dir)
		);

		if (isForbiddenDirectory) {
			this.logger.warn(
				`Attempted access to forbidden directory: ${req.url}`
			);
			res.status(403).json({ message: 'Access denied' });
			return;
		}

		const isValidDirectory = this.validDirectories.some(dir =>
			resolvedPath.includes(dir)
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

		if (
			this.forbiddenFiles.includes(filename) ||
			this.forbiddenExtensions.includes(fileExt)
		) {
			this.logger.warn(
				`Attempted access to forbidden file or file type: ${filename}`
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
