import setupLogger from '../config/logger';

const logger = await setupLogger();

export const parseBoolean = (value: string | boolean | undefined): boolean => {
	if (typeof value === 'string') {
		value = value.toLowerCase();
	}

	if (value === true || value === 'true') {
		return true;
	} else if (value === false || value === 'false') {
		return false;
	} else {
		logger.warn(
			`parseBoolean received an unexpected value: "${value}". Defaulting to false.`
		);

		return false;
	}
};
