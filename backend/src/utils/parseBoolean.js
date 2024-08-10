export const parseBoolean = (value) => {
	if (value === 'true') {
		return true;
	} else if (value === 'false') {
		return false;
	} else {
		console.error(
			'parseBoolean cannot parse a value other than "true" or "false". Could not convert string into boolean.'
		);
		throw new Error('Invalid string. Could not parse to boolean');
	}
};
