import { constants as cryptoConstants } from 'crypto';
import path from 'path';
import { SecureContextOptions } from 'tls';
import { ConfigService } from './configService';
import { envVariables } from '../environment/envVars';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/validateDependencies';
import { constants } from 'buffer';

export type Options = SecureContextOptions;

export interface TLSKeys {
	key: string | undefined;
	cert: string | undefined;
}

export const ciphers = [
   'ECDHE-ECDSA-AES256-GCM-SHA384',
   'ECDHE-RSA-AES256-GCM-SHA384',
   'ECDHE-ECDSA-CHACHA20-POLY1305',
   'ECDHE-RSA-CHACHA20-POLY1305',
   'ECDHE-ECDSA-AES128-GCM-SHA256',
   'ECDHE-RSA-AES128-GCM-SHA256',
   'ECDHE-ECDSA-AES256-SHA384',
   'ECDHE-RSA-AES256-SHA384',
   'ECDHE-ECDSA-AES128-SHA256',
   'ECDHE-RSA-AES128-SHA256'
];

export const secureOptions = cryptoConstants.SSL_OP_NO_TLSv1 | cryptoConstants.SSL_OP_NO_TLSv1_1;

export const tlsCertPath = envVariables.serverTLSCertPath;
export const tlsKeyPath = envVariables.serverTLSKeyPath;

export async function declareHttpServerOptions({
	fs
}: {
	fs: typeof import('fs').promises;
	constants: typeof cryptoConstants;
	ciphers: string[];
}): Promise<Options> {
	const configService = ConfigService.getInstance();
	const featureFlags = configService.getFeatureFlags();
	const appLogger = configService.getLogger();

	try {
		validateDependencies(
			[
				{ name: 'fs', instance: fs },
				{ name: 'ciphers', instance: ciphers },
				{ name: 'constants', instance: constants }
			],
			appLogger || console
		);

		const tlsKey = configService.getEnvVariables().serverTLSKeyPath;
		const tlsCert = configService.getEnvVariables().serverTLSKeyPath;
		appLogger.info('SSL Keys decrypted and retrieved');

		return {
			key: tlsKey,
			cert: tlsCert,
			secureOptions:
				cryptoConstants.SSL_OP_NO_TLSv1 | cryptoConstants.SSL_OP_NO_TLSv1_1,
			ciphers: ciphers.join(':'),
			honorCipherOrder: featureFlags.honorCipherOrder
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
		ErrorLogger.logError(serviceError, appLogger);
		processError(serviceError, appLogger || console);
		throw serviceError;
	}
}
