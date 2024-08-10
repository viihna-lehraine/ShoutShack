export const parseBoolean = (value) => {
	if (typeof value === 'string') {
		value = value.toLowerCase();
	}

	if (value === true || value === 'true') {
		return true;
	} else if (value === false || value === 'false') {
		return false;
	} else {
		console.warn(
			`parseBoolean received an unexpected value: "${value}". Defaulting to false.`
		);
		return false;
	}
};
