import { Request, Response, NextFunction } from 'express';
export declare function sanitizeInput(input: string): string;
export declare function sanitizeRequestBody(body: Record<string, unknown>): Promise<Record<string, unknown>>;
export declare function validateBlotEntry(req: Request, res: Response, next: NextFunction): Response | void;
export declare function handleValidationErrors(req: Request, res: Response, next: NextFunction): Response | void;
//# sourceMappingURL=validator.d.ts.map