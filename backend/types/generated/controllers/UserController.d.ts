import { User } from '../models/User';
import { UserControllerInterface } from '../index/interfaces/services';
import { UserAttributesInterface, UserInstanceInterface } from '../index/interfaces/models';
import { UserControllerDeps } from '../index/interfaces/serviceDeps';
import { InferAttributes, WhereOptions } from 'sequelize/types';
export declare class UserController implements UserControllerInterface {
    private static instance;
    private passwordService;
    private logger;
    private errorLogger;
    private errorHandler;
    private envConfig;
    private secrets;
    private mailer;
    private userModel;
    private constructor();
    static getInstance(): Promise<UserController>;
    private mapToUserInstance;
    findOne(criteria: WhereOptions<InferAttributes<User>>): Promise<UserInstanceInterface | null>;
    findUserById(userId: string): Promise<UserInstanceInterface | null>;
    findUserByEmail(email: string): Promise<UserInstanceInterface | null>;
    createUser(userDetails: Omit<UserAttributesInterface, 'id' | 'creationDate' | 'userId'>): Promise<UserInstanceInterface | null>;
    private checkPasswordStrength;
    verifyUserAccount(userId: string): Promise<boolean>;
    private removeUndefinedFields;
    updateUser(user: UserInstanceInterface, updatedDetails: Partial<UserInstanceInterface>): Promise<UserInstanceInterface | null>;
    private sendConfirmationEmail;
    deleteUser(userId: string): Promise<boolean>;
    shutdown(): Promise<void>;
    protected loadAxios(): Promise<UserControllerDeps['axios']>;
    private loadJwt;
    private loadUuidv4;
    private loadZxcvbn;
}
//# sourceMappingURL=UserController.d.ts.map