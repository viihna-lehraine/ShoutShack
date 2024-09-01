import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
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
export default function createUserSessionModel(sequelize: Sequelize): typeof UserSession;
export {};
//# sourceMappingURL=UserSession.d.ts.map