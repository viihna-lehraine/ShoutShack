import argon2 from 'argon2';
import { SecretsMap } from '../utils/sops';

type UserSecrets = Pick<SecretsMap, 'PEPPER'>;

export const hashConfig = {
	type: argon2.argon2id,
	memoryCost: 48640, // 47.5 MiB memory
	timeCost: 4, // 4 iterations
	parallelism: 1
};

export async function hashPassword(password: string, secrets: UserSecrets): Promise<string> {
	return argon2.hash(password + secrets.PEPPER, hashConfig);
}
