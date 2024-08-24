import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
interface UserAttributes {
	id: string;
	userid?: number;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken?: string | null;
	resetPasswordExpires?: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
}
declare class User
	extends Model<InferAttributes<User>, InferCreationAttributes<User>>
	implements UserAttributes
{
	id: string;
	userid?: number;
	username: string;
	password: string;
	email: string;
	isAccountVerified: boolean;
	resetPasswordToken: string | null;
	resetPasswordExpires: Date | null;
	isMfaEnabled: boolean;
	creationDate: Date;
	comparePassword(password: string): Promise<boolean>;
	static validatePassword(password: string): boolean;
	static createUser(
		username: string,
		password: string,
		email: string
	): Promise<User>;
}
declare const UserModelPromise: Promise<typeof User>;
export default UserModelPromise;
//# sourceMappingURL=User.d.ts.map
