import argon2 from 'argon2';
import { EnvSecretsMap } from '../environment/envSecrets';
import { errorClasses } from '../errors/errorClasses';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { ErrorLogger } from 'src/errors/errorLogger';

type UserSecrets = Pick<EnvSecretsMap, 'PEPPER'>;

interface HashPasswordDependencies {
	password: string;
	secrets: UserSecrets;
	appLogger: Logger;
}

export const hashConfig = {
	type: argon2.argon2id,
	memoryCost: 48640, // 47.5 MiB memory
	timeCost: 4, // 4 iterations
	parallelism: 1
};

export async function hashPassword({
	password,
	secrets,
	appLogger
}: HashPasswordDependencies): Promise<string> {
	try {
		validateDependencies(
			[
				{ name: 'password', instance: password },
				{ name: 'secrets', instance: secrets }
			],
			appLogger || console
		);
		return await argon2.hash(password + secrets.PEPPER, hashConfig);
	} catch (utilError) {
		const utility: string = 'hashPassword()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			utility,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(utilityError, appLogger);
		processError(utilityError, appLogger || console);
		return '';
	}
}
