import argon2 from 'argon2';
import { SecretsMap } from './sops';
import { errorClasses } from '../errors/errorClasses';
import { processError } from '../errors/processError';
import { Logger } from '../utils/logger';
import { validateDependencies } from '../utils/validateDependencies';
import { ErrorLogger } from 'src/errors/errorLogger';

type UserSecrets = Pick<SecretsMap, 'PEPPER'>;

interface HashPasswordDependencies {
	password: string;
	secrets: UserSecrets;
	logger: Logger;
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
	logger
}: HashPasswordDependencies): Promise<string> {
	try {
		validateDependencies(
			[
				{ name: 'password', instance: password },
				{ name: 'secrets', instance: secrets }
			],
			logger || console
		);
		return await argon2.hash(password + secrets.PEPPER, hashConfig);
	} catch (utilError) {
		const utility: string = 'hashPassword()';
		const utilityError = new errorClasses.UtilityErrorRecoverable(
			utility,
			{ exposeToClient: false }
		);
		ErrorLogger.logError(utilityError, logger);
		processError(utilityError, logger || console);
		return '';
	}
}
