import { Logger } from 'winston';
interface User {
    id: string;
    username: string;
}
export declare function createJwtUtil(logger: Logger): {
    generateJwt: (user: User) => Promise<string>;
    verifyJwt: (token: string) => Promise<string | object | null>;
};
export default createJwtUtil;
//# sourceMappingURL=jwtUtil.d.ts.map