// File: server/src/common/main.ts

import { Utilities } from '../../types/index.js';

const parseBoolean = (value: string | undefined): boolean => {
	if (!value) throw new Error('Missing required boolean environment variable!');
	const normalized = value.trim().toLowerCase();

	if (['true', 't', '1', 'yes', 'on'].includes(normalized)) return true;
	if (['false', 'f', '0', 'no', 'off'].includes(normalized)) return false;

	throw new Error(`Invalid boolean for environment variable! Value: "${value}"`);
};

const parseNumber = (value: string | undefined): number => {
	if (!value) throw new Error('Missing required number environment variable!');
	const parsed = parseInt(value, 10);

	if (isNaN(parsed)) {
		throw new Error(`Invalid number for environment variable! Value: "${value}"`);
	}

	return parsed;
};

const parseString = (value: string | undefined, envVarName: string): string => {
	if (!value) throw new Error(`Missing required environment variable: ${envVarName}`);
	return value;
};

export const utils: Utilities = {
	parseBoolean,
	parseNumber,
	parseString
};
