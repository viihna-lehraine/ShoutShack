import {
	AppLoggerServiceInterface,
	DependencyInterface,
	ValidateDependenciesInterface
} from '../index/interfaces/main';
import { validateDependencies } from '../utils/helpers';

export class DependencyValidationService
	implements ValidateDependenciesInterface
{
	validateDependencies(
		dependencies: DependencyInterface[],
		logger: AppLoggerServiceInterface
	): void {
		validateDependencies(dependencies, logger);
	}
}

export const validationService = new DependencyValidationService();
