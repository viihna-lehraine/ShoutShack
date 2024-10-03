import {
	DependencyInterface,
	ValidateDependenciesInterface
} from '../index/interfaces/serviceComponents';
import { AppLoggerServiceInterface } from '../index/interfaces/services';
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
