interface User {
    id: string;
    username: string;
}
export declare function createJwtUtil(): {
    generateToken: (user: User) => Promise<string>;
    verifyJwtToken: (token: string) => Promise<string | object | null>;
};
export default createJwtUtil;
//# sourceMappingURL=jwtUtil.d.ts.map