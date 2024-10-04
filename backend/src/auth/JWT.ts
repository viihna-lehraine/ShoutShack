import {
	AppLoggerServiceInterface,
	CacheServiceInterface,
	ErrorLoggerServiceInterface,
	ErrorHandlerServiceInterface,
	JWTServiceInterface,
	VaultServiceInterface
} from '../index/interfaces/services';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ServiceFactory } from '../index/factory';
import { withRetry } from '../utils/helpers';

export class JWTService implements JWTServiceInterface {
	private static instance: JWTService | null = null;

	private logger!: AppLoggerServiceInterface;
	private errorLogger!: ErrorLoggerServiceInterface;
	private errorHandler!: ErrorHandlerServiceInterface;
	private cacheService!: CacheServiceInterface;
	private vault!: VaultServiceInterface;

	private constructor() {}

	public static async getInstance(): Promise<JWTService> {
		if (!JWTService.instance) {
			const logger = await ServiceFactory.getLoggerService();
			const errorLogger = await ServiceFactory.getErrorLoggerService();
			const errorHandler = await ServiceFactory.getErrorHandlerService();
			const cacheService = await ServiceFactory.getCacheService();
			const vault = await ServiceFactory.getVaultService();

			JWTService.instance = new JWTService();
			JWTService.instance.logger = logger;
			JWTService.instance.errorLogger = errorLogger;
			JWTService.instance.errorHandler = errorHandler;
			JWTService.instance.cacheService = cacheService;
			JWTService.instance.vault = vault;
		}

		return JWTService.instance;
	}

	public async generateJWT(id: string, username: string): Promise<string> {
		try {
			const secret = await withRetry(
				() => this.vault.retrieveSecret('JWT_SECRET', secret => secret),
				3,
				500
			);

			if (!secret) {
				const utilityError =
					new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
						`Failed to retrieve JWT secret in 'generateJwt'`
					);
				this.errorLogger.logWarn(utilityError.message);
				this.errorHandler.handleError({ error: utilityError });
				return '';
			}

			return jwt.sign({ id, username }, secret, {
				expiresIn: '1h'
			});
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to generate JWT in 'generateJwt': ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logWarn(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return '';
		}
	}

	public async verifyJWT(token: string): Promise<string | JwtPayload | null> {
		try {
			const cachedResult = await this.cacheService.get<
				string | JwtPayload
			>(`jwt:${token}`, 'jwtService');

			if (cachedResult) {
				return cachedResult;
			}

			const secret = await withRetry(
				() => this.vault.retrieveSecret('JWT_SECRET', secret => secret),
				3,
				500
			);

			if (!secret) {
				const utilityError =
					new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
						`Failed to retrieve JWT secret in 'verifyJwt'`
					);
				this.errorLogger.logWarn(utilityError.message);
				this.errorHandler.handleError({ error: utilityError });
				return null;
			}

			const verifiedToken = jwt.verify(token, secret) as
				| string
				| JwtPayload;

			if (typeof verifiedToken !== 'string') {
				const ttl = verifiedToken.exp
					? verifiedToken.exp * 1000 - Date.now()
					: 3600 * 1000;
				await this.cacheService.set(
					`jwt:${token}`,
					verifiedToken,
					'jwtService',
					Math.max(ttl, 5000)
				);
			}

			return verifiedToken;
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Failed to verify JWT in 'verifyJwt': ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logWarn(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
			return null;
		}
	}

	public async shutdown(): Promise<void> {
		try {
			this.logger.info('Clearing JWTService cache before shutdown...');
			await this.cacheService.clearNamespace('jwtService');

			this.logger.info('JWTService cache cleared successfully.');
			JWTService.instance = null;
			this.logger.info('JWTService shutdown completed.');
		} catch (error) {
			const utilityError =
				new this.errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error during JWTService shutdown: ${error instanceof Error ? error.message : error}`
				);
			this.errorLogger.logError(utilityError.message);
			this.errorHandler.handleError({ error: utilityError });
		}
	}
}
