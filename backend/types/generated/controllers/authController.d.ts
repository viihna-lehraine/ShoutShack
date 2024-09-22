import argon2 from 'argon2';
import { Request, Response } from 'express';
import createJwtUtil from '../auth/jwtAuth';
import { Logger } from '../utils/logger';
import createUserModel from '../models/UserModelFile';
interface AuthDependencies {
    logger: Logger;
    UserModel: ReturnType<typeof createUserModel>;
    jwtUtil: ReturnType<typeof createJwtUtil>;
    argon2: typeof argon2;
}
export declare function login({ logger, UserModel, jwtUtil, argon2 }: AuthDependencies): (req: Request, res: Response) => Promise<Response | void>;
export {};
//# sourceMappingURL=authController.d.ts.map
