import { AppLoggerServiceInterface, DependencyInterface, ValidateDependenciesInterface } from '../index/interfaces/main';
export declare class DependencyValidationService implements ValidateDependenciesInterface {
    validateDependencies(dependencies: DependencyInterface[], logger: AppLoggerServiceInterface): void;
}
export declare const validationService: DependencyValidationService;
//# sourceMappingURL=utilClasses.d.ts.map