import { AppLogger } from '../services/appLogger';
import {
	Dependency,
	ValidateDependencies
} from '../interfaces/utilityInterfaces';

export class DependencyValidationService implements ValidateDependencies {
	validateDependencies(
		dependencies: Dependency[],
		appLogger: AppLogger
	): void {
		this.validateDependencies(dependencies, appLogger);
	}
}

export const validationService = new DependencyValidationService();
