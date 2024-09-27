import argon2 from 'argon2';
import { errorHandler } from '../services/errorHandler';
import { validateDependencies } from '../utils/helpers';
import { hashConfig } from '../utils/constants';
import { ServiceFactory } from '../index/factory';

export async function hashPassword(password: string): Promise<string> {
	const logger = ServiceFactory.getLoggerService();
	const errorLogger = ServiceFactory.getErrorLoggerService();
	const secrets = ServiceFactory.getSecretsStore();

	try {
		validateDependencies(
			[{ name: 'password', instance: password }],
			logger || console
		);

		const pepper = secrets.retrieveSecrets('PEPPER');

		if (pepper) {
			const hashConfigError =
				new errorHandler.ErrorClasses.ConfigurationError(
					`Unable to retrieve pepper from secrets. Password cannoty not be hashed.`,
					{ exposeToClient: false }
				);
			errorLogger.logError(hashConfigError.message);
			errorHandler.handleError({ error: hashConfigError });
			logger.error('Failed to retrieve pepper from secrets');
			throw hashConfigError;
		}

		return await argon2.hash(password + pepper, hashConfig);
	} catch (hashUtilEror) {
		const hashUtilityError =
			new errorHandler.ErrorClasses.UtilityErrorRecoverable(
				`${hashUtilEror instanceof Error ? hashUtilEror.message : hashUtilEror}`
			);
		errorLogger.logError(hashUtilityError.message);
		errorHandler.handleError({ error: hashUtilityError });
		return '';
	} finally {
		logger.debug('Password hashed successfully');

		secrets.reEncryptSecret('PEPPER');
	}
}
