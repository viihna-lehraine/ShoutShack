import { constants as cryptoConstants } from 'crypto';
import { DeclareWebServerOptionsInterface, WebServerOptions } from '../index/webServerInterfaces';
import { AppError } from '../errors/errorClasses';
import { ConfigService } from '../services/configService';
import { isAppLogger } from '../services/appLogger';

export async function declareWebServerOptions(params: DeclareWebServerOptionsInterface): Promise<WebServerOptions> {
	const {
		constants,
		blankRequest,
		fs,
		appLogger,
		configService,
		errorClasses,
		errorLoggerDetails,
		errorLogger,
		ErrorSeverity,
		getCallerInfo,
		processError,
		validateDependencies
	} = params;

	const webServerSecureOptions = cryptoConstants.SSL_OP_NO_TLSv1 | cryptoConstants.SSL_OP_NO_TLSv1_1;

	try {
		validateDependencies(
			[
				{ name: 'constants', instance: constants },
				{ name: 'fs', instance: fs },
				{ name: 'tlsCiphers', instance: tlsCiphers }
			],
			appLogger
		);

		return {
			key: configService.getEnvVariables().tlsKeyPath1,
			cert: configService.getEnvVariables().tlsCertPath1,
			secureOptions: webServerSecureOptions,
			ciphers: tlsCiphers.join(':'),
			honorCipherOrder: configService.getFeatureFlags().honorCipherOrder!,
		};
	} catch (error) {
		const serviceError = new errorClasses.ServiceUnavailableErrorFatal(
			'HTTP/HTTPS Server',
			{
				message: `Failed to declare options required for HTTP/HTTPS server\n${error instanceof Error ? error.message : error}`,
				originalError: error,
				statusCode: 500,
				severity: ErrorSeverity.FATAL,
				exposeToClient: false
			}
		);
		errorLogger.logError(
			serviceError as AppError,
			errorLoggerDetails(getCallerInfo, blankRequest, 'DECLARE_HTTPS_OPTIONS'),
			appLogger,
			ErrorSeverity.FATAL
		);
		processError(
			appLogger,
			ConfigService,
			errorLogger,
			errorLoggerDetails,
			console,
			isAppLogger,
			error
		);
		throw serviceError;
	}
}
