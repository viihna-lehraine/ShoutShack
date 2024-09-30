import { JWTServiceInterface } from '../index/interfaces';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ServiceFactory } from '../index/factory';
import { withRetry } from '../utils/helpers';

export class JWTService implements JWTServiceInterface {
	private static instance: JWTService | null = null;
	private logger = ServiceFactory.getLoggerService();
	private errorLogger = ServiceFactory.getErrorLoggerService();
	private errorHandler = ServiceFactory.getErrorHandlerService();
	private cacheService = ServiceFactory.getCacheService();
	private secrets = ServiceFactory.getSecretsStore();

	private constructor() {}

	public static getInstance(): JWTService {
		if (!JWTService.instance) {
			JWTService.instance = new JWTService();
		}

		return JWTService.instance;
	}

	public async generateJWT(id: string, username: string): Promise<string> {
		try {
			const secret = await withRetry(
				() =>
					this.secrets.retrieveSecret('JWT_SECRET', secret => secret),
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
				() =>
					this.secrets.retrieveSecret('JWT_SECRET', secret => secret),
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
}
