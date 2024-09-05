import { Logger } from '../config/logger';
interface Dependency {
    name: string;
    instance: unknown;
}
export declare function validateDependencies(dependencies: Dependency[], logger?: Logger | Console): void;
export {};
//# sourceMappingURL=validateDependencies.d.ts.map