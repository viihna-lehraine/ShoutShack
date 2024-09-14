import argon2 from 'argon2';
import { Logger } from '../utils/logger';
import { processError } from '../utils/processError';
import { SecretsMap } from '../utils/sops';
import { validateDependencies } from '../utils/validateDependencies';

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
	} catch (error) {
		processError(error, logger || console);
		return '';
	}
}
