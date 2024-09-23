export type FeatureFlagValueType =
	(typeof import('../index/parameters').FeatureFlagNames)[FeatureFlagNamesType];

export type FeatureFlagNamesType =
	keyof typeof import('../index/parameters').FeatureFlagNames;

export type FidoFactor = 'first' | 'second' | 'either';
