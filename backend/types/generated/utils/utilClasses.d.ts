import { DependencyInterface, ValidateDependenciesInterface } from '../index/interfaces/serviceComponents';
import { AppLoggerServiceInterface } from '../index/interfaces/services';
export declare class DependencyValidationService implements ValidateDependenciesInterface {
    validateDependencies(dependencies: DependencyInterface[], logger: AppLoggerServiceInterface): void;
}
export declare const validationService: DependencyValidationService;
//# sourceMappingURL=utilClasses.d.ts.map