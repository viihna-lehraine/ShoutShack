import { Logger } from 'winston';

export function createFeatureEnabler(logger: Logger) {
    return {
        enableFeatureBasedOnFlag(
			flag: boolean,
			description: string,
			callback: () => void
		) {
            if (flag) {
                logger.info(
					`Enabling ${description} (flag is ${flag})`
				);
                callback();
            } else {
                logger.info(
					`Skipping ${description} (flag is ${flag})`
				);
            }
        },
        enableFeatureWithProdOverride(
			flag: boolean,
			description: string,
			callback: () => void
		) {
            if (process.env.NODE_ENV === 'production') {
                logger.info(
					`Enabling ${description} in production regardless of flag value.`
				);
                callback();
            } else if (flag) {
                logger.info(
					`Enabling ${description} (flag is ${flag})`
				);
                callback();
            } else {
                logger.info(
					`Skipping ${description} (flag is ${flag})`
				);
            }
        },
    };
}
