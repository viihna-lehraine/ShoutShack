import { Request, Response } from 'express';
import { Logger } from '../config/logger';
import createJwtUtil from '../auth/jwtUtil';
import createUserModel from '../models/User';
import argon2 from 'argon2';
interface AuthDependencies {
    logger: Logger;
    UserModel: ReturnType<typeof createUserModel>;
    jwtUtil: ReturnType<typeof createJwtUtil>;
    argon2: typeof argon2;
}
export declare function login({ logger, UserModel, jwtUtil, argon2 }: AuthDependencies): (req: Request, res: Response) => Promise<Response | void>;
export {};
//# sourceMappingURL=authController.d.ts.map