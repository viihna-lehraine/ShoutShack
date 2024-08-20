import jwt from 'jsonwebtoken';
interface User {
    id: string;
    username: string;
}
export declare const generateToken: (user: User) => Promise<string>;
export declare const verifyJwToken: (token: string) => Promise<string | jwt.JwtPayload | null>;
export default verifyJwToken;
//# sourceMappingURL=jwtUtil.d.ts.map