import { ErrorLoggerServiceInterface } from './services';

export type FeatureFlagValueType =
	(typeof import('../parameters').FeatureFlagNames)[FeatureFlagNamesType];

export type FeatureFlagNamesType =
	keyof typeof import('../parameters').FeatureFlagNames;

export type FidoFactor = 'first' | 'second' | 'either';

export type EnvVariableInterface = string | number | boolean | undefined;

export type LoggerServiceInterface = ErrorLoggerServiceInterface;
