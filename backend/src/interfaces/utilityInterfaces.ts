export interface Dependency {
	name: string;
	instance: unknown;
}

export interface ErrorLoggerDetails {
	getCallerInfo: () => string;
	req: import('express').Request;
	requestIdVal?: string;
	adminIdVal?: string;
	userIdVal?: string;
	actionVal?: string;
	ipVal?: string;
	userAgentVal?: string;
}

export interface ValidateDependencies {
	validateDependencies(
		dependencies: Dependency[],
		appLogger: import('../services/appLogger').AppLogger
	): void;
}
