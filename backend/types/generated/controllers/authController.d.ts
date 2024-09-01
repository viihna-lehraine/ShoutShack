import { Request, Response } from 'express';
import { Logger } from 'winston';
import createJwtUtil from '../utils/auth/jwtUtil';
import createUserModel from '../models/User';
import argon2 from 'argon2';
interface AuthDependencies {
    logger: Logger;
    UserModel: ReturnType<typeof createUserModel>;
    jwtUtil: ReturnType<typeof createJwtUtil>;
    argon2: typeof argon2;
}
export declare const login: ({ logger, UserModel, jwtUtil }: AuthDependencies) => (req: Request, res: Response) => Promise<Response | null>;
export {};
//# sourceMappingURL=authController.d.ts.map