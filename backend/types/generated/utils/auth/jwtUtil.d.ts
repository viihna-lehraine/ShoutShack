import jwt from 'jsonwebtoken';
interface User {
    id: string;
    username: string;
}
export declare let generateToken: (user: User) => Promise<string>;
export declare let verifyJwToken: (token: string) => Promise<string | jwt.JwtPayload | null>;
export default verifyJwToken;
//# sourceMappingURL=jwtUtil.d.ts.map