import { JWTServiceInterface } from '../index/interfaces/services';
import { JwtPayload } from 'jsonwebtoken';
export declare class JWTService implements JWTServiceInterface {
    private static instance;
    private logger;
    private errorLogger;
    private errorHandler;
    private cacheService;
    private vault;
    private constructor();
    static getInstance(): Promise<JWTService>;
    generateJWT(id: string, username: string): Promise<string>;
    verifyJWT(token: string): Promise<string | JwtPayload | null>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=JWT.d.ts.map