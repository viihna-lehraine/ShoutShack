import { constants as cryptoConstants } from 'crypto';
import { AppLoggerInterface, DeclareWebServerOptionsInterface, WebServerOptions } from '../index/interfaces';
import { tlsCiphers } from '../utils/constants';

export async function declareWebServerOptions(params: DeclareWebServerOptionsInterface): Promise<WebServerOptions> {
	const {
		configService,
		errorLogger,
		errorHandler,
		validateDependencies
	} = params;

	const logger: AppLoggerInterface = configService.getAppLogger();
	const webServerSecureOptions = cryptoConstants.SSL_OP_NO_TLSv1 | cryptoConstants.SSL_OP_NO_TLSv1_1;

	try {
		validateDependencies(
			[{ name: 'tlsCiphers', instance: tlsCiphers }],
			logger
		);

		return {
			key: configService.getEnvVariables().tlsKeyPath1,
			cert: configService.getEnvVariables().tlsCertPath1,
			secureOptions: webServerSecureOptions,
			ciphers: tlsCiphers.join(':'),
			honorCipherOrder: configService.getFeatureFlags().honorCipherOrder!,
		};
	} catch (error) {
		const serviceError = new errorHandler.ErrorClasses.ServiceUnavailableErrorFatal(
			'HTTP/HTTPS Server',
			{
				message: `Failed to declare options required for HTTP/HTTPS server\n${error instanceof Error ? error.message : error}`,
				originalError: error
			}
		);
		errorLogger.logError(serviceError.message);
		errorHandler.handleError({ error: serviceError });
		throw serviceError;
	}
}
