import { ErrorLoggerServiceInterface } from './services';

export type FeatureFlagValueType =
	(typeof import('./main').FeatureFlagNames)[FeatureFlagNamesType];

export type FeatureFlagNamesType =
	keyof typeof import('./main').FeatureFlagNames;

export type FidoFactor = 'first' | 'second' | 'either';

export type EnvVariableInterface = string | number | boolean | undefined;

export type LoggerServiceInterface = ErrorLoggerServiceInterface;
