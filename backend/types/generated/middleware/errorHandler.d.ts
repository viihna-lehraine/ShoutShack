import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
declare function errorHandler(err: AppError | Error, req: Request, res: Response, next: NextFunction): void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map