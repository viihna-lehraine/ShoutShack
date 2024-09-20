import argon2 from 'argon2';
import { ConfigService } from './configService';
import { errorClasses, ErrorSeverity } from '../errors/errorClasses';
import { processError } from '../errors/processError';
import { validateDependencies } from '../utils/validateDependencies';
import { ErrorLogger } from 'src/errors/errorLogger';

interface HashPasswordDependencies {
	password: string;
}

export const hashConfig = {
	type: argon2.argon2id,
	memoryCost: 48640,
	timeCost: 4,
	parallelism: 1
};

export async function hashPassword({ password }: HashPasswordDependencies): Promise<string> {
	const configService = ConfigService.getInstance();
	const appLogger = configService.getLogger();
	const secrets = configService.getSecrets();

	try {
		validateDependencies(
			[{ name: 'password', instance: password }],
			appLogger || console
		);

		if (!secrets || !secrets.PEPPER) {
			const hashConfigError = new errorClasses.ConfigurationError(
				`Error occurred when retrieving pepper from secrets`,
				{
					statusCode: 404,
					severity: ErrorSeverity.FATAL,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(hashConfigError, appLogger || console);
			processError(hashConfigError, appLogger || console);
			appLogger.error('Failed to retrieve pepper from secrets');
			throw hashConfigError;
		}

		return await argon2.hash(password + secrets.PEPPER, hashConfig);
	} catch (hashUtilEror) {
		const utility: string = 'hashPassword()';
		const hashUtilityError = new errorClasses.UtilityErrorRecoverable(
			utility,
			{
				originalError: hashUtilEror,
				statusCode: 500,
				severity: ErrorSeverity.RECOVERABLE,
				exposeToClient: false
			}
		);
		ErrorLogger.logError(hashUtilityError, appLogger || console);
		processError(hashUtilityError, appLogger || console);
		return '';
	}
}
