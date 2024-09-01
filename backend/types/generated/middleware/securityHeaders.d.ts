import { Application } from 'express';
import { HelmetOptions } from 'helmet';
interface SecurityHeadersDependencies {
    helmetOptions?: HelmetOptions;
    permissionsPolicyOptions?: {
        [key: string]: string[];
    };
}
export declare function setupSecurityHeaders(app: Application, { helmetOptions, permissionsPolicyOptions }: SecurityHeadersDependencies): void;
export {};
//# sourceMappingURL=securityHeaders.d.ts.map