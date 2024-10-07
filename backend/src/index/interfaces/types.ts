import { ErrorLoggerServiceInterface } from './main';

export type FeatureFlagValueType =
	(typeof import('../interfaces/main').FeatureFlagNames)[FeatureFlagNamesType];

export type FeatureFlagNamesType =
	keyof typeof import('../interfaces/main').FeatureFlagNames;

export type FidoFactor = 'first' | 'second' | 'either';

export type EnvVariableInterface = string | number | boolean | undefined;

export type LoggerServiceInterface = ErrorLoggerServiceInterface;
