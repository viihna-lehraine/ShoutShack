import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { UserSessionAttributes } from '../index/interfaces/models';
export declare class UserSession extends Model<InferAttributes<UserSession>, InferCreationAttributes<UserSession>> implements UserSessionAttributes {
    id: string;
    sessionId: number;
    ipAddress: string;
    userAgent: string;
    createdAt: CreationOptional<Date>;
    updatedAt: Date | null;
    expiresAt: Date;
    isActive: boolean;
}
export declare function createUserSessionModel(): Promise<typeof UserSession | null>;
//# sourceMappingURL=UserSession.d.ts.map