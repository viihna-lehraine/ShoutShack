import { NextFunction, Request, Response } from 'express';
import '../../types/custom/express-session';
declare function slowdownMiddleware(req: Request, res: Response, next: NextFunction): void;
export default slowdownMiddleware;
//# sourceMappingURL=slowdown.d.ts.map