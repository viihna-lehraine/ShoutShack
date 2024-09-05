import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
interface UserSessionAttributes {
    id: string;
    sessionId: number;
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
    ipAddress: string;
    userAgent: string;
    createdAt: CreationOptional<Date>;
    updatedAt: Date | null;
    expiresAt: Date;
    isActive: boolean;
}
export default function createUserSessionModel(sequelize: Sequelize, logger: Logger): typeof UserSession;
export { UserSession };
//# sourceMappingURL=UserSession.d.ts.map