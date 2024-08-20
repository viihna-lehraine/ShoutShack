import { Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
interface UserSessionAttributes {
    id: string;
    sessionId: number;
    userId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    updatedAt?: Date | null;
    expiresAt: Date;
    isActive: boolean;
}
declare class UserSession extends Model<InferAttributes<UserSession>, InferCreationAttributes<UserSession>> implements UserSessionAttributes {
    id: string;
    sessionId: number;
    userId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: CreationOptional<Date>;
    updatedAt: Date | null;
    expiresAt: Date;
    isActive: boolean;
}
declare const UserSessionModelPromise: Promise<typeof UserSession>;
export default UserSessionModelPromise;
//# sourceMappingURL=UserSession.d.ts.map