import path from 'path';
import { promises as fs } from 'fs';
import { BaseRouter } from './BaseRouter.mjs';
import { validateDependencies } from '../utils/helpers.mjs';
import { withRetry } from '../utils/helpers.mjs';
import { fileCacheTTLConfig } from '../config/cache.mjs';
export class StaticRouter extends BaseRouter {
	staticRootPath = this.envConfig.getEnvVariable('staticRootPath');
	validCSSFiles = {};
	validFontFiles = {};
	validHTMLFiles = {};
	validIconFiles = {};
	validImageFiles = {};
	validJSFiles = {};
	validLogoFiles = {};
	validMDFiles = {};
	validTXTFiles = {};
	validXMLFiles = {};
	cssDirectory = path.join(this.staticRootPath, 'css');
	fontDirectory = path.join(this.staticRootPath, 'assets/fonts');
	htmlDirectory = this.staticRootPath;
	iconDirectory = path.join(this.staticRootPath, 'assets/icons');
	imageDirectory = path.join(this.staticRootPath, 'assets/images');
	jsDirectory = path.join(this.staticRootPath, 'dist');
	logoDirectory = path.join(this.staticRootPath, 'assets/logos');
	mdDirectory = this.staticRootPath;
	txtDirectory = this.staticRootPath;
	xmlDirectory = this.staticRootPath;
	forbiddenDirectories = [];
	forbiddenExtensions = [];
	forbiddenFiles = [];
	validDirectories = [];
	validExtensions = [];
	cacheTTLs = fileCacheTTLConfig;
	constructor(
		logger,
		errorLogger,
		errorHandler,
		envConfig,
		cacheService,
		gatekeeperService,
		helmetService,
		JWTMiddleware,
		passportMiddleware
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
	async initializeStaticRouter() {
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
	async importRules() {
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
	async validateConfiguration() {
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
	async handleRequest(req, res, next) {
		const filePath = path.join(this.staticRootPath, req.path);
		if (req.path === '/') {
			await this.serveIndexFile(req, res, next);
		} else {
			await this.serveStaticFile(filePath, req.path, req, res, next);
		}
	}
	// *DEV-NOTE* this should work with Gatekeeper to track any IP that is making directory traversal attempts and act accordingly
	async serveStaticFile(filePath, route, req, res, next) {
		const cacheKey = this.getCacheKey(route);
		const fileExtension = path.extname(filePath);
		const cacheTTL = this.getCacheTTL(fileExtension);
		await withRetry(
			async () => {
				await this.blockForbiddenFiles(req, res, next);
				const cachedFile = await this.cacheService.get(
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
				let serveFunction;
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
	getCacheTTL(fileExtension) {
		return this.cacheTTLs[fileExtension] || this.cacheTTLs['default'];
	}
	getCacheKey(route) {
		return `static:${route}`;
	}
	async readFileContent(filePath) {
		return await fs.readFile(filePath, 'utf8');
	}
	async serveIndexFile(req, res, next) {
		const indexFile = this.validHTMLFiles['index'];
		if (typeof indexFile !== 'string') {
			this.logger.warn(`Index page not found or invalid`);
			res.status(404).json({ message: 'Index page not found' });
			return;
		}
		const filePath = path.join(this.staticRootPath, indexFile);
		return new Promise((resolve, reject) => {
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
	async serveNotFoundPage(req, res, next) {
		const notFoundPage = this.validHTMLFiles['notFound'];
		if (typeof notFoundPage !== 'string') {
			this.logger.warn(`not-found.html file is missing`);
			res.status(404).json({ message: 'Page not found' });
			return;
		}
		const filePath = path.join(this.staticRootPath, notFoundPage);
		await this.serveStaticFile(filePath, 'not-found', req, res, next);
	}
	async serveCSSFile(req, res, next) {
		const cssFile = req.params.file;
		if (typeof cssFile !== 'string') {
			this.logger.warn(
				`CSS file not found or invalid: ${req.params.filename}`
			);
		}
		const filePath = path.join(this.cssDirectory, cssFile);
		return new Promise((resolve, reject) => {
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
	async serveHTMLFile(req, res, next) {
		const page = req.params.page;
		const filePathEntry = this.validHTMLFiles[page];
		if (typeof filePathEntry !== 'string') {
			this.logger.warn(`HTML page not found: ${page}`);
			await this.serveNotFoundPage(req, res, next);
			return;
		}
		const filePath = path.join(this.staticRootPath, filePathEntry);
		return new Promise((resolve, reject) => {
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
	async serveIconFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Icon file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Logo file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveImageFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveJSFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Javascript file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Javascript file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveLogoFile(req, res, next) {
		const imageFile = this.validImageFiles[req.params.filename];
		if (typeof imageFile !== 'string') {
			this.logger.warn(
				`Image file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Image file not found' });
			return;
		}
		const filePath = path.join(this.imageDirectory, imageFile);
		return new Promise((resolve, reject) => {
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
	async serveMDFile(req, res, next) {
		const jsFile = this.validJSFiles[req.params.filename];
		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Markdown file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Markdown file not found' });
			return;
		}
		const filePath = path.join(this.jsDirectory, jsFile);
		return new Promise((resolve, reject) => {
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
	async serveTXTFile(req, res, next) {
		const jsFile = this.validJSFiles[req.params.filename];
		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`Text file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}
		const filePath = path.join(this.jsDirectory, jsFile);
		return new Promise((resolve, reject) => {
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
	async serveXMLFile(req, res, next) {
		const jsFile = this.validJSFiles[req.params.filename];
		if (typeof jsFile !== 'string') {
			this.logger.warn(
				`XML file not found or invalid: ${req.params.filename}`
			);
			res.status(404).json({ message: 'Text file not found' });
			return;
		}
		const filePath = path.join(this.jsDirectory, jsFile);
		return new Promise((resolve, reject) => {
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
	validateFiles(directory, fileRecord, allowedFiles, validExtensions) {
		try {
			const validFiles = Object.keys(allowedFiles);
			const filesInDirectory = Object.keys(fileRecord);
			filesInDirectory.forEach(file => {
				const filePaths = Array.isArray(fileRecord[file])
					? fileRecord[file]
					: [fileRecord[file]];
				filePaths.forEach(filePath => {
					const ext = path.extname(filePath);
					if (
						!validFiles.includes(filePath) ||
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
				`Error validating files in directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	setUpPeriodicValidation(
		directory,
		fileRecord,
		allowedFiles,
		validExtensions,
		intervalMs
	) {
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
				`Error setting up periodic validation for directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	async blockForbiddenFiles(req, res, next) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RhdGljUm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JvdXRlcnMvU3RhdGljUm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLEVBQUUsUUFBUSxJQUFJLEVBQUUsRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBYzFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ3hELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUVyRCxNQUFNLE9BQU8sWUFBYSxTQUFRLFVBQVU7SUFDbkMsY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFakUsYUFBYSxHQUFvQixFQUFFLENBQUM7SUFDcEMsY0FBYyxHQUFvQixFQUFFLENBQUM7SUFDckMsY0FBYyxHQUFvQixFQUFFLENBQUM7SUFDckMsY0FBYyxHQUFvQixFQUFFLENBQUM7SUFDckMsZUFBZSxHQUFvQixFQUFFLENBQUM7SUFDdEMsWUFBWSxHQUFvQixFQUFFLENBQUM7SUFDbkMsY0FBYyxHQUFvQixFQUFFLENBQUM7SUFDckMsWUFBWSxHQUFvQixFQUFFLENBQUM7SUFDbkMsYUFBYSxHQUFvQixFQUFFLENBQUM7SUFDcEMsYUFBYSxHQUFvQixFQUFFLENBQUM7SUFFcEMsWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRCxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQy9ELGFBQWEsR0FB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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dEZ1bmN0aW9uLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmcyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IEJhc2VSb3V0ZXIgfSBmcm9tICcuL0Jhc2VSb3V0ZXInO1xuaW1wb3J0IHtcblx0QXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0Q2FjaGVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFbnZDb25maWdTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFcnJvckhhbmRsZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRFcnJvckxvZ2dlclNlcnZpY2VJbnRlcmZhY2UsXG5cdEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRIZWxtZXRNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0SldUQXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRQYXNzcG9ydEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0U3RhdGljUm91dGVySW50ZXJmYWNlXG59IGZyb20gJy4uL2luZGV4L2ludGVyZmFjZXMvc2VydmljZXMnO1xuaW1wb3J0IHsgRmlsZVR5cGVSZWNvcmRzIH0gZnJvbSAnLi4vaW5kZXgvaW50ZXJmYWNlcy9zZXJ2aWNlQ29tcG9uZW50cyc7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL2hlbHBlcnMnO1xuaW1wb3J0IHsgd2l0aFJldHJ5IH0gZnJvbSAnLi4vdXRpbHMvaGVscGVycyc7XG5pbXBvcnQgeyBmaWxlQ2FjaGVUVExDb25maWcgfSBmcm9tICcuLi9jb25maWcvY2FjaGUnO1xuXG5leHBvcnQgY2xhc3MgU3RhdGljUm91dGVyIGV4dGVuZHMgQmFzZVJvdXRlciBpbXBsZW1lbnRzIFN0YXRpY1JvdXRlckludGVyZmFjZSB7XG5cdHByaXZhdGUgc3RhdGljUm9vdFBhdGggPSB0aGlzLmVudkNvbmZpZy5nZXRFbnZWYXJpYWJsZSgnc3RhdGljUm9vdFBhdGgnKTtcblxuXHRwcml2YXRlIHZhbGlkQ1NTRmlsZXM6IEZpbGVUeXBlUmVjb3JkcyA9IHt9O1xuXHRwcml2YXRlIHZhbGlkRm9udEZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZEhUTUxGaWxlczogRmlsZVR5cGVSZWNvcmRzID0ge307XG5cdHByaXZhdGUgdmFsaWRJY29uRmlsZXM6IEZpbGVUeXBlUmVjb3JkcyA9IHt9O1xuXHRwcml2YXRlIHZhbGlkSW1hZ2VGaWxlczogRmlsZVR5cGVSZWNvcmRzID0ge307XG5cdHByaXZhdGUgdmFsaWRKU0ZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZExvZ29GaWxlczogRmlsZVR5cGVSZWNvcmRzID0ge307XG5cdHByaXZhdGUgdmFsaWRNREZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZFRYVEZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblx0cHJpdmF0ZSB2YWxpZFhNTEZpbGVzOiBGaWxlVHlwZVJlY29yZHMgPSB7fTtcblxuXHRwcml2YXRlIGNzc0RpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnY3NzJyk7XG5cdHByaXZhdGUgZm9udERpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnYXNzZXRzL2ZvbnRzJyk7XG5cdHByaXZhdGUgaHRtbERpcmVjdG9yeSA9IHRoaXMuc3RhdGljUm9vdFBhdGg7XG5cdHByaXZhdGUgaWNvbkRpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnYXNzZXRzL2ljb25zJyk7XG5cdHByaXZhdGUgaW1hZ2VEaXJlY3RvcnkgPSBwYXRoLmpvaW4odGhpcy5zdGF0aWNSb290UGF0aCwgJ2Fzc2V0cy9pbWFnZXMnKTtcblx0cHJpdmF0ZSBqc0RpcmVjdG9yeSA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCAnZGlzdCcpO1xuXHRwcml2YXRlIGxvZ29EaXJlY3RvcnkgPSBwYXRoLmpvaW4odGhpcy5zdGF0aWNSb290UGF0aCwgJ2Fzc2V0cy9sb2dvcycpO1xuXHRwcml2YXRlIG1kRGlyZWN0b3J5ID0gdGhpcy5zdGF0aWNSb290UGF0aDtcblx0cHJpdmF0ZSB0eHREaXJlY3RvcnkgPSB0aGlzLnN0YXRpY1Jvb3RQYXRoO1xuXHRwcml2YXRlIHhtbERpcmVjdG9yeSA9IHRoaXMuc3RhdGljUm9vdFBhdGg7XG5cblx0cHJpdmF0ZSBmb3JiaWRkZW5EaXJlY3Rvcmllczogc3RyaW5nW10gPSBbXTtcblx0cHJpdmF0ZSBmb3JiaWRkZW5FeHRlbnNpb25zOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGZvcmJpZGRlbkZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIHZhbGlkRGlyZWN0b3JpZXM6IHN0cmluZ1tdID0gW107XG5cdHByaXZhdGUgdmFsaWRFeHRlbnNpb25zOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGNhY2hlVFRMcyA9IGZpbGVDYWNoZVRUTENvbmZpZztcblxuXHRwcml2YXRlIGNvbnN0cnVjdG9yKFxuXHRcdGxvZ2dlcjogQXBwTG9nZ2VyU2VydmljZUludGVyZmFjZSxcblx0XHRlcnJvckxvZ2dlcjogRXJyb3JMb2dnZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyU2VydmljZUludGVyZmFjZSxcblx0XHRlbnZDb25maWc6IEVudkNvbmZpZ1NlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Y2FjaGVTZXJ2aWNlOiBDYWNoZVNlcnZpY2VJbnRlcmZhY2UsXG5cdFx0Z2F0ZWtlZXBlclNlcnZpY2U6IEdhdGVrZWVwZXJTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdGhlbG1ldFNlcnZpY2U6IEhlbG1ldE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlLFxuXHRcdEpXVE1pZGRsZXdhcmU6IEpXVEF1dGhNaWRkbGV3YXJlU2VydmljZUludGVyZmFjZSxcblx0XHRwYXNzcG9ydE1pZGRsZXdhcmU6IFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVTZXJ2aWNlSW50ZXJmYWNlXG5cdCkge1xuXHRcdHN1cGVyKFxuXHRcdFx0bG9nZ2VyLFxuXHRcdFx0ZXJyb3JMb2dnZXIsXG5cdFx0XHRlcnJvckhhbmRsZXIsXG5cdFx0XHRlbnZDb25maWcsXG5cdFx0XHRjYWNoZVNlcnZpY2UsXG5cdFx0XHRnYXRla2VlcGVyU2VydmljZSxcblx0XHRcdGhlbG1ldFNlcnZpY2UsXG5cdFx0XHRKV1RNaWRkbGV3YXJlLFxuXHRcdFx0cGFzc3BvcnRNaWRkbGV3YXJlXG5cdFx0KTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBpbml0aWFsaXplU3RhdGljUm91dGVyKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHdpdGhSZXRyeShcblx0XHRcdGFzeW5jICgpID0+IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5pbXBvcnRSdWxlcygpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLnZhbGlkYXRlQ29uZmlndXJhdGlvbigpO1xuXG5cdFx0XHRcdGNvbnN0IHJvdXRlclJ1bGVzID0gYXdhaXQgaW1wb3J0KCcuLi9jb25maWcvcm91dGVyUnVsZXMnKTtcblx0XHRcdFx0Y29uc3QgdmFsaWRhdGlvbkludGVydmFscyA9IHJvdXRlclJ1bGVzLnZhbGlkYXRpb25JbnRlcnZhbHM7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLmNzc0RpcmVjdG9yeSxcblx0XHRcdFx0XHR0aGlzLnZhbGlkQ1NTRmlsZXMsXG5cdFx0XHRcdFx0dGhpcy52YWxpZENTU0ZpbGVzLFxuXHRcdFx0XHRcdFsnLmNzcyddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMuY3NzXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLmZvbnREaXJlY3RvcnksXG5cdFx0XHRcdFx0dGhpcy52YWxpZEZvbnRGaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkRm9udEZpbGVzLFxuXHRcdFx0XHRcdFsnLnR0ZiddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMuZm9udFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdHRoaXMuc2V0VXBQZXJpb2RpY1ZhbGlkYXRpb24oXG5cdFx0XHRcdFx0dGhpcy5odG1sRGlyZWN0b3J5LFxuXHRcdFx0XHRcdHRoaXMudmFsaWRIVE1MRmlsZXMsXG5cdFx0XHRcdFx0dGhpcy52YWxpZEhUTUxGaWxlcyxcblx0XHRcdFx0XHRbJy5odG1sJ10sXG5cdFx0XHRcdFx0dmFsaWRhdGlvbkludGVydmFscy5odG1sXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLmljb25EaXJlY3RvcnksXG5cdFx0XHRcdFx0dGhpcy52YWxpZEljb25GaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkSWNvbkZpbGVzLFxuXHRcdFx0XHRcdFsnLnBuZyddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMuaWNvblxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdHRoaXMuc2V0VXBQZXJpb2RpY1ZhbGlkYXRpb24oXG5cdFx0XHRcdFx0dGhpcy5pbWFnZURpcmVjdG9yeSxcblx0XHRcdFx0XHR0aGlzLnZhbGlkSW1hZ2VGaWxlcyxcblx0XHRcdFx0XHR0aGlzLnZhbGlkSW1hZ2VGaWxlcyxcblx0XHRcdFx0XHRbJy5ibXAnLCAnLmpwZycsICcuanBlZycsICcucG5nJywgJy5naWYnLCAnLndlYnAnXSxcblx0XHRcdFx0XHR2YWxpZGF0aW9uSW50ZXJ2YWxzLmltYWdlXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLmpzRGlyZWN0b3J5LFxuXHRcdFx0XHRcdHRoaXMudmFsaWRKU0ZpbGVzLFxuXHRcdFx0XHRcdHRoaXMudmFsaWRKU0ZpbGVzLFxuXHRcdFx0XHRcdFsnLmpzJ10sXG5cdFx0XHRcdFx0dmFsaWRhdGlvbkludGVydmFscy5qc1xuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdHRoaXMuc2V0VXBQZXJpb2RpY1ZhbGlkYXRpb24oXG5cdFx0XHRcdFx0dGhpcy5sb2dvRGlyZWN0b3J5LFxuXHRcdFx0XHRcdHRoaXMudmFsaWRMb2dvRmlsZXMsXG5cdFx0XHRcdFx0dGhpcy52YWxpZExvZ29GaWxlcyxcblx0XHRcdFx0XHRbJy5zdmcnXSxcblx0XHRcdFx0XHR2YWxpZGF0aW9uSW50ZXJ2YWxzLmxvZ29cblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0aGlzLnNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdFx0XHRcdHRoaXMubWREaXJlY3RvcnksXG5cdFx0XHRcdFx0dGhpcy52YWxpZE1ERmlsZXMsXG5cdFx0XHRcdFx0dGhpcy52YWxpZE1ERmlsZXMsXG5cdFx0XHRcdFx0WycubWQnXSxcblx0XHRcdFx0XHR2YWxpZGF0aW9uSW50ZXJ2YWxzLm1kXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLnR4dERpcmVjdG9yeSxcblx0XHRcdFx0XHR0aGlzLnZhbGlkVFhURmlsZXMsXG5cdFx0XHRcdFx0dGhpcy52YWxpZFRYVEZpbGVzLFxuXHRcdFx0XHRcdFsnLnR4dCddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMudHh0XG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dGhpcy5zZXRVcFBlcmlvZGljVmFsaWRhdGlvbihcblx0XHRcdFx0XHR0aGlzLnhtbERpcmVjdG9yeSxcblx0XHRcdFx0XHR0aGlzLnZhbGlkWE1MRmlsZXMsXG5cdFx0XHRcdFx0dGhpcy52YWxpZFhNTEZpbGVzLFxuXHRcdFx0XHRcdFsnLnhtbCddLFxuXHRcdFx0XHRcdHZhbGlkYXRpb25JbnRlcnZhbHMueG1sXG5cdFx0XHRcdCk7XG5cdFx0XHR9LFxuXHRcdFx0NSxcblx0XHRcdDEwMDBcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBpbXBvcnRSdWxlcygpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgcm91dGVyUnVsZXMgPSBhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZy9yb3V0ZXJSdWxlcycpO1xuXG5cdFx0XHR0aGlzLmZvcmJpZGRlbkRpcmVjdG9yaWVzID0gcm91dGVyUnVsZXMuZm9yYmlkZGVuRGlyZWN0b3JpZXM7XG5cdFx0XHR0aGlzLmZvcmJpZGRlbkV4dGVuc2lvbnMgPSByb3V0ZXJSdWxlcy5mb3JiaWRkZW5FeHRlbnNpb25zO1xuXHRcdFx0dGhpcy5mb3JiaWRkZW5GaWxlcyA9IHJvdXRlclJ1bGVzLmZvcmJpZGRlbkZpbGVzO1xuXHRcdFx0dGhpcy52YWxpZERpcmVjdG9yaWVzID0gcm91dGVyUnVsZXMudmFsaWREaXJlY3Rvcmllcztcblx0XHRcdHRoaXMudmFsaWRFeHRlbnNpb25zID0gcm91dGVyUnVsZXMudmFsaWRFeHRlbnNpb25zO1xuXHRcdFx0dGhpcy52YWxpZENTU0ZpbGVzID0gcm91dGVyUnVsZXMudmFsaWRDU1NGaWxlcztcblx0XHRcdHRoaXMudmFsaWRGb250RmlsZXMgPSByb3V0ZXJSdWxlcy52YWxpZEZvbnRGaWxlcztcblx0XHRcdHRoaXMudmFsaWRIVE1MRmlsZXMgPSByb3V0ZXJSdWxlcy52YWxpZEhUTUxGaWxlcztcblx0XHRcdHRoaXMudmFsaWRNREZpbGVzID0gcm91dGVyUnVsZXMudmFsaWRNREZpbGVzO1xuXHRcdFx0dGhpcy52YWxpZFRYVEZpbGVzID0gcm91dGVyUnVsZXMudmFsaWRUWFRGaWxlcztcblx0XHRcdHRoaXMudmFsaWRYTUxGaWxlcyA9IHJvdXRlclJ1bGVzLnZhbGlkWE1MRmlsZXM7XG5cblx0XHRcdHRoaXMubG9nZ2VyLmluZm8oJ1N0YXRpYyBSb3V0ZXIgcnVsZXMgaW1wb3J0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRgRmFpbGVkIHRvIGltcG9ydCByb3V0ZXIgcnVsZXNcXG4ke0Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6ICdVbmtub3duIGVycm9yJ31gXG5cdFx0XHQpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgdmFsaWRhdGVDb25maWd1cmF0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFx0W3sgbmFtZTogJ3N0YXRpY1Jvb3RQYXRoJywgaW5zdGFuY2U6IHRoaXMuc3RhdGljUm9vdFBhdGggfV0sXG5cdFx0XHR0aGlzLmxvZ2dlclxuXHRcdCk7XG5cblx0XHRpZiAoIXRoaXMuc3RhdGljUm9vdFBhdGggfHwgdHlwZW9mIHRoaXMuc3RhdGljUm9vdFBhdGggIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgdGhpcy5lcnJvckhhbmRsZXIuRXJyb3JDbGFzc2VzLkNvbmZpZ3VyYXRpb25FcnJvcihcblx0XHRcdFx0J0ludmFsaWQgc3RhdGljUm9vdFBhdGg6IG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyxcblx0XHRcdFx0eyBleHBvc2VUb0NsaWVudDogZmFsc2UgfVxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRhd2FpdCB3aXRoUmV0cnkoKCkgPT4gdGhpcy5pbXBvcnRSdWxlcygpLCAzLCAxMDAwKTtcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBoYW5kbGVSZXF1ZXN0KFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCByZXEucGF0aCk7XG5cblx0XHRpZiAocmVxLnBhdGggPT09ICcvJykge1xuXHRcdFx0YXdhaXQgdGhpcy5zZXJ2ZUluZGV4RmlsZShyZXEsIHJlcywgbmV4dCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGF3YWl0IHRoaXMuc2VydmVTdGF0aWNGaWxlKGZpbGVQYXRoLCByZXEucGF0aCwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0fVxuXG5cdC8vICpERVYtTk9URSogdGhpcyBzaG91bGQgd29yayB3aXRoIEdhdGVrZWVwZXIgdG8gdHJhY2sgYW55IElQIHRoYXQgaXMgbWFraW5nIGRpcmVjdG9yeSB0cmF2ZXJzYWwgYXR0ZW1wdHMgYW5kIGFjdCBhY2NvcmRpbmdseVxuXHRwcml2YXRlIGFzeW5jIHNlcnZlU3RhdGljRmlsZShcblx0XHRmaWxlUGF0aDogc3RyaW5nLFxuXHRcdHJvdXRlOiBzdHJpbmcsXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGNhY2hlS2V5ID0gdGhpcy5nZXRDYWNoZUtleShyb3V0ZSk7XG5cdFx0Y29uc3QgZmlsZUV4dGVuc2lvbiA9IHBhdGguZXh0bmFtZShmaWxlUGF0aCk7XG5cdFx0Y29uc3QgY2FjaGVUVEwgPSB0aGlzLmdldENhY2hlVFRMKGZpbGVFeHRlbnNpb24pO1xuXG5cdFx0YXdhaXQgd2l0aFJldHJ5KFxuXHRcdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmJsb2NrRm9yYmlkZGVuRmlsZXMocmVxLCByZXMsIG5leHQpO1xuXG5cdFx0XHRcdGNvbnN0IGNhY2hlZEZpbGUgPSBhd2FpdCB0aGlzLmNhY2hlU2VydmljZS5nZXQ8c3RyaW5nPihcblx0XHRcdFx0XHRjYWNoZUtleSxcblx0XHRcdFx0XHQnc3RhdGljLWZpbGVzJ1xuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGlmIChjYWNoZWRGaWxlKSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgU2VydmluZyBmaWxlIGZyb20gY2FjaGU6ICR7Y2FjaGVLZXl9YCk7XG5cdFx0XHRcdFx0cmVzLnNlbmQoY2FjaGVkRmlsZSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgcmVzb2x2ZWRQYXRoID0gcGF0aC5yZXNvbHZlKGZpbGVQYXRoKTtcblx0XHRcdFx0Y29uc3QgYWxsb3dlZFBhdGggPSBwYXRoLnJlc29sdmUodGhpcy5zdGF0aWNSb290UGF0aCk7XG5cblx0XHRcdFx0aWYgKCFyZXNvbHZlZFBhdGguc3RhcnRzV2l0aChhbGxvd2VkUGF0aCkpIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRcdFx0YEF0dGVtcHRlZCBkaXJlY3RvcnkgdHJhdmVyc2FsIGJ5ICR7cmVxLmlwfSB0byAke3JlcS51cmx9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0cmVzLnN0YXR1cyg0MDMpLmpzb24oeyBtZXNzYWdlOiAnQWNjZXNzIGRlbmllZCcgfSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHJlc29sdmVkUGF0aCk7XG5cdFx0XHRcdGxldCBzZXJ2ZUZ1bmN0aW9uOiAoXG5cdFx0XHRcdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdFx0XHRcdHJlczogUmVzcG9uc2UsXG5cdFx0XHRcdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdFx0XHRcdCkgPT4gUHJvbWlzZTx2b2lkPjtcblxuXHRcdFx0XHRzd2l0Y2ggKGV4dCkge1xuXHRcdFx0XHRcdGNhc2UgJy5odG1sJzpcblx0XHRcdFx0XHRcdHNlcnZlRnVuY3Rpb24gPSB0aGlzLnNlcnZlSFRNTEZpbGUuYmluZCh0aGlzKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJy5jc3MnOlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVDU1NGaWxlLmJpbmQodGhpcyk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICcuanMnOlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVKU0ZpbGUuYmluZCh0aGlzKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJy5pY28nOlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVJY29uRmlsZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnLnBuZyc6XG5cdFx0XHRcdFx0Y2FzZSAnLmpwZyc6XG5cdFx0XHRcdFx0Y2FzZSAnLmpwZWcnOlxuXHRcdFx0XHRcdGNhc2UgJy5naWYnOlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVJbWFnZUZpbGUuYmluZCh0aGlzKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJy53ZWJwJzpcblx0XHRcdFx0XHRcdHNlcnZlRnVuY3Rpb24gPSB0aGlzLnNlcnZlTG9nb0ZpbGUuYmluZCh0aGlzKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJy5tZCc6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZU1ERmlsZS5iaW5kKHRoaXMpO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnLnR4dCc6XG5cdFx0XHRcdFx0XHRzZXJ2ZUZ1bmN0aW9uID0gdGhpcy5zZXJ2ZVRYVEZpbGUuYmluZCh0aGlzKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJy54bWwnOlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVYTUxGaWxlLmJpbmQodGhpcyk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0c2VydmVGdW5jdGlvbiA9IHRoaXMuc2VydmVOb3RGb3VuZFBhZ2UuYmluZCh0aGlzKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0YXdhaXQgc2VydmVGdW5jdGlvbihyZXEsIHJlcywgbmV4dCk7XG5cblx0XHRcdFx0XHRjb25zdCBmaWxlQ29udGVudCA9XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnJlYWRGaWxlQ29udGVudChyZXNvbHZlZFBhdGgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuY2FjaGVTZXJ2aWNlLnNldChcblx0XHRcdFx0XHRcdGNhY2hlS2V5LFxuXHRcdFx0XHRcdFx0ZmlsZUNvbnRlbnQsXG5cdFx0XHRcdFx0XHQnc3RhdGljLWZpbGVzJyxcblx0XHRcdFx0XHRcdGNhY2hlVFRMXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKFxuXHRcdFx0XHRcdFx0YFNlcnZlZCBhbmQgY2FjaGVkIHN0YXRpYyBmaWxlOiAke3JvdXRlfSB3aXRoIFRUTDogJHtjYWNoZVRUTH0gc2Vjb25kc2Bcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdFx0XHRgRXJyb3Igc2VydmluZyBzdGF0aWMgZmlsZSAke3JvdXRlfTogJHtcblx0XHRcdFx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuXHRcdFx0XHRcdFx0XHRcdD8gZXJyb3IubWVzc2FnZVxuXHRcdFx0XHRcdFx0XHRcdDogJ1Vua25vd24gZXJyb3InXG5cdFx0XHRcdFx0XHR9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7cm91dGV9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRuZXh0KGVycm9yKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdDMsXG5cdFx0XHQ1MDBcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRDYWNoZVRUTChmaWxlRXh0ZW5zaW9uOiBzdHJpbmcpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLmNhY2hlVFRMc1tmaWxlRXh0ZW5zaW9uXSB8fCB0aGlzLmNhY2hlVFRMc1snZGVmYXVsdCddO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRDYWNoZUtleShyb3V0ZTogc3RyaW5nKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gYHN0YXRpYzoke3JvdXRlfWA7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlYWRGaWxlQ29udGVudChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRyZXR1cm4gYXdhaXQgZnMucmVhZEZpbGUoZmlsZVBhdGgsICd1dGY4Jyk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlSW5kZXhGaWxlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBpbmRleEZpbGUgPSB0aGlzLnZhbGlkSFRNTEZpbGVzWydpbmRleCddO1xuXG5cdFx0aWYgKHR5cGVvZiBpbmRleEZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbmRleCBwYWdlIG5vdCBmb3VuZCBvciBpbnZhbGlkYCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6ICdJbmRleCBwYWdlIG5vdCBmb3VuZCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5zdGF0aWNSb290UGF0aCwgaW5kZXhGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIGluZGV4IGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIGluZGV4IGZpbGU6ICR7ZmlsZVBhdGh9YCk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0cHVibGljIGFzeW5jIHNlcnZlTm90Rm91bmRQYWdlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBub3RGb3VuZFBhZ2UgPSB0aGlzLnZhbGlkSFRNTEZpbGVzWydub3RGb3VuZCddO1xuXG5cdFx0aWYgKHR5cGVvZiBub3RGb3VuZFBhZ2UgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBub3QtZm91bmQuaHRtbCBmaWxlIGlzIG1pc3NpbmdgKTtcblx0XHRcdHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogJ1BhZ2Ugbm90IGZvdW5kJyB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCBub3RGb3VuZFBhZ2UpO1xuXHRcdGF3YWl0IHRoaXMuc2VydmVTdGF0aWNGaWxlKGZpbGVQYXRoLCAnbm90LWZvdW5kJywgcmVxLCByZXMsIG5leHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZXJ2ZUNTU0ZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGNzc0ZpbGUgPSByZXEucGFyYW1zLmZpbGU7XG5cblx0XHRpZiAodHlwZW9mIGNzc0ZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgQ1NTIGZpbGUgbm90IGZvdW5kIG9yIGludmFsaWQ6ICR7cmVxLnBhcmFtcy5maWxlbmFtZX1gXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuY3NzRGlyZWN0b3J5LCBjc3NGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIENTUyBmaWxlICR7ZmlsZVBhdGh9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLnNlbmRDbGllbnRFcnJvclJlc3BvbnNlKHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGAke2ZpbGVQYXRofSBub3QgZm91bmRgLFxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0LFxuXHRcdFx0XHRcdFx0cmVzXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dChlcnJvcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFNlcnZlZCBDU1MgZmlsZTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlSFRNTEZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHBhZ2UgPSByZXEucGFyYW1zLnBhZ2U7XG5cdFx0Y29uc3QgZmlsZVBhdGhFbnRyeSA9IHRoaXMudmFsaWRIVE1MRmlsZXNbcGFnZV07XG5cblx0XHRpZiAodHlwZW9mIGZpbGVQYXRoRW50cnkgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBIVE1MIHBhZ2Ugbm90IGZvdW5kOiAke3BhZ2V9YCk7XG5cdFx0XHRhd2FpdCB0aGlzLnNlcnZlTm90Rm91bmRQYWdlKHJlcSwgcmVzLCBuZXh0KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLnN0YXRpY1Jvb3RQYXRoLCBmaWxlUGF0aEVudHJ5KTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGFzeW5jIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIEhUTUwgZmlsZSAke2ZpbGVQYXRofTogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnNlcnZlTm90Rm91bmRQYWdlKHJlcSwgcmVzLCBuZXh0KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdG5leHQoZXJyb3IpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBTZXJ2ZWQgSFRNTCBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRuZXh0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZXJ2ZUljb25GaWxlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBpbWFnZUZpbGUgPSB0aGlzLnZhbGlkSW1hZ2VGaWxlc1tyZXEucGFyYW1zLmZpbGVuYW1lXTtcblxuXHRcdGlmICh0eXBlb2YgaW1hZ2VGaWxlICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YEljb24gZmlsZSBub3QgZm91bmQgb3IgaW52YWxpZDogJHtyZXEucGFyYW1zLmZpbGVuYW1lfWBcblx0XHRcdCk7XG5cblx0XHRcdHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogJ0xvZ28gZmlsZSBub3QgZm91bmQnIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuaW1hZ2VEaXJlY3RvcnksIGltYWdlRmlsZSk7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0cmVzLnNlbmRGaWxlKGZpbGVQYXRoLCBlcnJvciA9PiB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdFx0XHRgRXJyb3Igc2VydmluZyBpY29uIGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIGljb24gZmlsZTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlSW1hZ2VGaWxlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBpbWFnZUZpbGUgPSB0aGlzLnZhbGlkSW1hZ2VGaWxlc1tyZXEucGFyYW1zLmZpbGVuYW1lXTtcblxuXHRcdGlmICh0eXBlb2YgaW1hZ2VGaWxlICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YEltYWdlIGZpbGUgbm90IGZvdW5kIG9yIGludmFsaWQ6ICR7cmVxLnBhcmFtcy5maWxlbmFtZX1gXG5cdFx0XHQpO1xuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiAnSW1hZ2UgZmlsZSBub3QgZm91bmQnIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuaW1hZ2VEaXJlY3RvcnksIGltYWdlRmlsZSk7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0cmVzLnNlbmRGaWxlKGZpbGVQYXRoLCBlcnJvciA9PiB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdFx0XHRgRXJyb3Igc2VydmluZyBpbWFnZSBmaWxlICR7ZmlsZVBhdGh9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLnNlbmRDbGllbnRFcnJvclJlc3BvbnNlKHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGAke2ZpbGVQYXRofSBub3QgZm91bmRgLFxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0LFxuXHRcdFx0XHRcdFx0cmVzXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dChlcnJvcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFNlcnZlZCBpbWFnZSBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VydmVKU0ZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGltYWdlRmlsZSA9IHRoaXMudmFsaWRJbWFnZUZpbGVzW3JlcS5wYXJhbXMuZmlsZW5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBpbWFnZUZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgSmF2YXNjcmlwdCBmaWxlIG5vdCBmb3VuZCBvciBpbnZhbGlkOiAke3JlcS5wYXJhbXMuZmlsZW5hbWV9YFxuXHRcdFx0KTtcblx0XHRcdHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgbWVzc2FnZTogJ0phdmFzY3JpcHQgZmlsZSBub3QgZm91bmQnIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuaW1hZ2VEaXJlY3RvcnksIGltYWdlRmlsZSk7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0cmVzLnNlbmRGaWxlKGZpbGVQYXRoLCBlcnJvciA9PiB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdFx0XHRgRXJyb3Igc2VydmluZyBqYXZhc2NyaXB0IGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIGphdmFzY3JpcHQgZmlsZTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlTG9nb0ZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGltYWdlRmlsZSA9IHRoaXMudmFsaWRJbWFnZUZpbGVzW3JlcS5wYXJhbXMuZmlsZW5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBpbWFnZUZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgSW1hZ2UgZmlsZSBub3QgZm91bmQgb3IgaW52YWxpZDogJHtyZXEucGFyYW1zLmZpbGVuYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6ICdJbWFnZSBmaWxlIG5vdCBmb3VuZCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5pbWFnZURpcmVjdG9yeSwgaW1hZ2VGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIGltYWdlIGZpbGUgJHtmaWxlUGF0aH06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckhhbmRsZXIuc2VuZENsaWVudEVycm9yUmVzcG9uc2Uoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogYCR7ZmlsZVBhdGh9IG5vdCBmb3VuZGAsXG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRcdFx0XHRyZXNcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KGVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgU2VydmVkIGxvZ28gZmlsZTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNlcnZlTURGaWxlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBqc0ZpbGUgPSB0aGlzLnZhbGlkSlNGaWxlc1tyZXEucGFyYW1zLmZpbGVuYW1lXTtcblxuXHRcdGlmICh0eXBlb2YganNGaWxlICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YE1hcmtkb3duIGZpbGUgbm90IGZvdW5kIG9yIGludmFsaWQ6ICR7cmVxLnBhcmFtcy5maWxlbmFtZX1gXG5cdFx0XHQpO1xuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiAnTWFya2Rvd24gZmlsZSBub3QgZm91bmQnIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRoaXMuanNEaXJlY3RvcnksIGpzRmlsZSk7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0cmVzLnNlbmRGaWxlKGZpbGVQYXRoLCBlcnJvciA9PiB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JMb2dnZXIubG9nRXJyb3IoXG5cdFx0XHRcdFx0XHRgRXJyb3Igc2VydmluZyBtYXJrZG93biBmaWxlICR7ZmlsZVBhdGh9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLnNlbmRDbGllbnRFcnJvclJlc3BvbnNlKHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGAke2ZpbGVQYXRofSBub3QgZm91bmRgLFxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0LFxuXHRcdFx0XHRcdFx0cmVzXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dChlcnJvcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFNlcnZlZCBtYXJrZG93biBmaWxlOiAke2ZpbGVQYXRofWApO1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VydmVUWFRGaWxlKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBqc0ZpbGUgPSB0aGlzLnZhbGlkSlNGaWxlc1tyZXEucGFyYW1zLmZpbGVuYW1lXTtcblxuXHRcdGlmICh0eXBlb2YganNGaWxlICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YFRleHQgZmlsZSBub3QgZm91bmQgb3IgaW52YWxpZDogJHtyZXEucGFyYW1zLmZpbGVuYW1lfWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwNCkuanNvbih7IG1lc3NhZ2U6ICdUZXh0IGZpbGUgbm90IGZvdW5kJyB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0aGlzLmpzRGlyZWN0b3J5LCBqc0ZpbGUpO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHJlcy5zZW5kRmlsZShmaWxlUGF0aCwgZXJyb3IgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLmVycm9yTG9nZ2VyLmxvZ0Vycm9yKFxuXHRcdFx0XHRcdFx0YEVycm9yIHNlcnZpbmcgdGV4dCBmaWxlICR7ZmlsZVBhdGh9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLnNlbmRDbGllbnRFcnJvclJlc3BvbnNlKHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGAke2ZpbGVQYXRofSBub3QgZm91bmRgLFxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0LFxuXHRcdFx0XHRcdFx0cmVzXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dChlcnJvcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFNlcnZlZCB0ZXh0IGZpbGU6ICR7ZmlsZVBhdGh9YCk7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZXJ2ZVhNTEZpbGUoXG5cdFx0cmVxOiBSZXF1ZXN0LFxuXHRcdHJlczogUmVzcG9uc2UsXG5cdFx0bmV4dDogTmV4dEZ1bmN0aW9uXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGpzRmlsZSA9IHRoaXMudmFsaWRKU0ZpbGVzW3JlcS5wYXJhbXMuZmlsZW5hbWVdO1xuXG5cdFx0aWYgKHR5cGVvZiBqc0ZpbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgWE1MIGZpbGUgbm90IGZvdW5kIG9yIGludmFsaWQ6ICR7cmVxLnBhcmFtcy5maWxlbmFtZX1gXG5cdFx0XHQpO1xuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLmpzb24oeyBtZXNzYWdlOiAnVGV4dCBmaWxlIG5vdCBmb3VuZCcgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4odGhpcy5qc0RpcmVjdG9yeSwganNGaWxlKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRyZXMuc2VuZEZpbGUoZmlsZVBhdGgsIGVycm9yID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5lcnJvckxvZ2dlci5sb2dFcnJvcihcblx0XHRcdFx0XHRcdGBFcnJvciBzZXJ2aW5nIFhNTCBmaWxlICR7ZmlsZVBhdGh9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWBcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHRoaXMuZXJyb3JIYW5kbGVyLnNlbmRDbGllbnRFcnJvclJlc3BvbnNlKHtcblx0XHRcdFx0XHRcdG1lc3NhZ2U6IGAke2ZpbGVQYXRofSBub3QgZm91bmRgLFxuXHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDA0LFxuXHRcdFx0XHRcdFx0cmVzXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHRyZXR1cm4gbmV4dChlcnJvcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFNlcnZlZCBYTUwgZmlsZTogJHtmaWxlUGF0aH1gKTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHZhbGlkYXRlRmlsZXMoXG5cdFx0ZGlyZWN0b3J5OiBzdHJpbmcsXG5cdFx0ZmlsZVJlY29yZDogRmlsZVR5cGVSZWNvcmRzLFxuXHRcdGFsbG93ZWRGaWxlczogRmlsZVR5cGVSZWNvcmRzLFxuXHRcdHZhbGlkRXh0ZW5zaW9uczogc3RyaW5nW11cblx0KTogdm9pZCB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHZhbGlkRmlsZXMgPSBPYmplY3Qua2V5cyhhbGxvd2VkRmlsZXMpO1xuXHRcdFx0Y29uc3QgZmlsZXNJbkRpcmVjdG9yeSA9IE9iamVjdC5rZXlzKGZpbGVSZWNvcmQpO1xuXG5cdFx0XHRmaWxlc0luRGlyZWN0b3J5LmZvckVhY2goZmlsZSA9PiB7XG5cdFx0XHRcdGNvbnN0IGZpbGVQYXRocyA9IEFycmF5LmlzQXJyYXkoZmlsZVJlY29yZFtmaWxlXSlcblx0XHRcdFx0XHQ/IGZpbGVSZWNvcmRbZmlsZV1cblx0XHRcdFx0XHQ6IFtmaWxlUmVjb3JkW2ZpbGVdXTtcblxuXHRcdFx0XHRmaWxlUGF0aHMuZm9yRWFjaChmaWxlUGF0aCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoIGFzIHN0cmluZyk7XG5cblx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHQhdmFsaWRGaWxlcy5pbmNsdWRlcyhmaWxlUGF0aCBhcyBzdHJpbmcpIHx8XG5cdFx0XHRcdFx0XHQhdmFsaWRFeHRlbnNpb25zLmluY2x1ZGVzKGV4dClcblx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0XHRcdGBJbnZhbGlkIG9yIGZvcmJpZGRlbiBmaWxlIGRldGVjdGVkIGluICR7ZGlyZWN0b3J5fTogJHtmaWxlUGF0aH1gXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5sb2dnZXIuaW5mbyhgVmFsaWRhdGlvbiBjb21wbGV0ZWQgZm9yICR7ZGlyZWN0b3J5fWApO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcblx0XHRcdFx0YEVycm9yIHZhbGlkYXRpbmcgZmlsZXMgaW4gZGlyZWN0b3J5ICR7ZGlyZWN0b3J5fTogJHtcblx0XHRcdFx0XHRlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuXHRcdFx0XHR9YFxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNldFVwUGVyaW9kaWNWYWxpZGF0aW9uKFxuXHRcdGRpcmVjdG9yeTogc3RyaW5nLFxuXHRcdGZpbGVSZWNvcmQ6IEZpbGVUeXBlUmVjb3Jkcyxcblx0XHRhbGxvd2VkRmlsZXM6IEZpbGVUeXBlUmVjb3Jkcyxcblx0XHR2YWxpZEV4dGVuc2lvbnM6IHN0cmluZ1tdLFxuXHRcdGludGVydmFsTXM6IG51bWJlclxuXHQpOiB2b2lkIHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy52YWxpZGF0ZUZpbGVzKFxuXHRcdFx0XHRkaXJlY3RvcnksXG5cdFx0XHRcdGZpbGVSZWNvcmQsXG5cdFx0XHRcdGFsbG93ZWRGaWxlcyxcblx0XHRcdFx0dmFsaWRFeHRlbnNpb25zXG5cdFx0XHQpO1xuXG5cdFx0XHRzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRcdHRoaXMudmFsaWRhdGVGaWxlcyhcblx0XHRcdFx0XHRkaXJlY3RvcnksXG5cdFx0XHRcdFx0ZmlsZVJlY29yZCxcblx0XHRcdFx0XHRhbGxvd2VkRmlsZXMsXG5cdFx0XHRcdFx0dmFsaWRFeHRlbnNpb25zXG5cdFx0XHRcdCk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmluZm8oXG5cdFx0XHRcdFx0YFBlcmlvZGljIHZhbGlkYXRpb24gY29tcGxldGVkIGZvciAke2RpcmVjdG9yeX1gXG5cdFx0XHRcdCk7XG5cdFx0XHR9LCBpbnRlcnZhbE1zKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXG5cdFx0XHRcdGBFcnJvciBzZXR0aW5nIHVwIHBlcmlvZGljIHZhbGlkYXRpb24gZm9yIGRpcmVjdG9yeSAke2RpcmVjdG9yeX06ICR7XG5cdFx0XHRcdFx0ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcblx0XHRcdFx0fWBcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBibG9ja0ZvcmJpZGRlbkZpbGVzKFxuXHRcdHJlcTogUmVxdWVzdCxcblx0XHRyZXM6IFJlc3BvbnNlLFxuXHRcdG5leHQ6IE5leHRGdW5jdGlvblxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBmaWxlUGF0aCA9IHBhdGgubm9ybWFsaXplKHJlcS51cmwpO1xuXHRcdGNvbnN0IHJlc29sdmVkUGF0aCA9IHBhdGgucmVzb2x2ZSh0aGlzLnN0YXRpY1Jvb3RQYXRoLCBmaWxlUGF0aCk7XG5cdFx0Y29uc3QgaXNGb3JiaWRkZW5EaXJlY3RvcnkgPSB0aGlzLmZvcmJpZGRlbkRpcmVjdG9yaWVzLnNvbWUoZGlyID0+XG5cdFx0XHRyZXNvbHZlZFBhdGguaW5jbHVkZXMocGF0aC5yZXNvbHZlKHRoaXMuc3RhdGljUm9vdFBhdGgsIGRpcikpXG5cdFx0KTtcblxuXHRcdGlmIChpc0ZvcmJpZGRlbkRpcmVjdG9yeSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YEF0dGVtcHRlZCBhY2Nlc3MgdG8gZm9yYmlkZGVuIGRpcmVjdG9yeTogJHtyZXEudXJsfWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwMykuanNvbih7IG1lc3NhZ2U6ICdBY2Nlc3MgZGVuaWVkJyB9KTtcblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlzVmFsaWREaXJlY3RvcnkgPSB0aGlzLnZhbGlkRGlyZWN0b3JpZXMuc29tZShkaXIgPT5cblx0XHRcdHJlc29sdmVkUGF0aC5pbmNsdWRlcyhwYXRoLnJlc29sdmUodGhpcy5zdGF0aWNSb290UGF0aCwgZGlyKSlcblx0XHQpO1xuXG5cdFx0aWYgKCFpc1ZhbGlkRGlyZWN0b3J5KSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFxuXHRcdFx0XHRgQXR0ZW1wdGVkIGFjY2VzcyB0byBpbnZhbGlkIGRpcmVjdG9yeTogJHtyZXEudXJsfWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwMykuanNvbih7IG1lc3NhZ2U6ICdBY2Nlc3MgZGVuaWVkJyB9KTtcblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVuYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCk7XG5cdFx0Y29uc3QgZmlsZUV4dCA9IHBhdGguZXh0bmFtZShmaWxlbmFtZSk7XG5cblx0XHRpZiAodGhpcy5mb3JiaWRkZW5GaWxlcy5pbmNsdWRlcyhmaWxlbmFtZSkpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYEF0dGVtcHRlZCBhY2Nlc3MgdG8gZm9yYmlkZGVuIGZpbGU6ICR7ZmlsZW5hbWV9YCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwMykuanNvbih7IG1lc3NhZ2U6ICdBY2Nlc3MgZGVuaWVkJyB9KTtcblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmZvcmJpZGRlbkV4dGVuc2lvbnMuaW5jbHVkZXMoZmlsZUV4dCkpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXG5cdFx0XHRcdGBBdHRlbXB0ZWQgYWNjZXNzIHRvIGZvcmJpZGRlbiBmaWxlIGV4dGVuc2lvbjogJHtmaWxlRXh0fWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwMykuanNvbih7IG1lc3NhZ2U6ICdBY2Nlc3MgZGVuaWVkJyB9KTtcblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlzVmFsaWRFeHRlbnNpb24gPSB0aGlzLnZhbGlkRXh0ZW5zaW9ucy5pbmNsdWRlcyhmaWxlRXh0KTtcblxuXHRcdGlmICghaXNWYWxpZEV4dGVuc2lvbikge1xuXHRcdFx0dGhpcy5sb2dnZXIud2Fybihcblx0XHRcdFx0YEF0dGVtcHRlZCBhY2Nlc3MgdG8gaW52YWxpZCBmaWxlIGV4dGVuc2lvbjogJHtmaWxlRXh0fWBcblx0XHRcdCk7XG5cdFx0XHRyZXMuc3RhdHVzKDQwMykuanNvbih7IG1lc3NhZ2U6ICdBY2Nlc3MgZGVuaWVkJyB9KTtcblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG5leHQoKTtcblx0fVxufVxuIl19
