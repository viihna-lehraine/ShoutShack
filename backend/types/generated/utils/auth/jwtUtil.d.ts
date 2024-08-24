interface User {
    id: string;
    username: string;
}
export declare const generateToken: (user: User) => Promise<string>;
export declare const verifyJwToken: (token: string) => Promise<string | object | null>;
export default verifyJwToken;
//# sourceMappingURL=jwtUtil.d.ts.map