import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../auth/hash';
import { validateDependencies } from '../utils/helpers';
import { UserAttributesInterface } from '../index/interfaces';
import { ServiceFactory } from 'src/index/factory';

const logger = ServiceFactory.getLoggerService();
const errorLogger = ServiceFactory.getErrorLoggerService();
const errorHandler = ServiceFactory.getErrorHandlerService();

export class User
	extends Model<InferAttributes<User>, InferCreationAttributes<User>>
	implements UserAttributesInterface
{
	public id!: string;
	public userId?: number;
	public username!: string;
	public password!: string;
	public email!: string;
	public isVerified!: boolean;
	public resetPasswordToken!: string | null;
	public resetPasswordExpires!: Date | null;
	public isMfaEnabled!: boolean;
	public creationDate!: CreationOptional<Date>;

	static initializeModel(sequelize: Sequelize): void {
		User.init(
			{
				id: {
					type: DataTypes.STRING,
					defaultValue: () => uuidv4(),
					allowNull: false,
					primaryKey: true,
					unique: true
				},
				userId: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				username: {
					type: DataTypes.STRING,
					allowNull: false,
					unique: true
				},
				password: {
					type: DataTypes.STRING,
					allowNull: false
				},
				email: {
					type: DataTypes.STRING,
					allowNull: false,
					unique: true
				},
				isVerified: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				resetPasswordToken: {
					type: DataTypes.STRING,
					allowNull: true
				},
				resetPasswordExpires: {
					type: DataTypes.DATE,
					allowNull: true
				},
				isMfaEnabled: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				creationDate: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW
				}
			},
			{
				sequelize,
				tableName: 'Users',
				timestamps: true
			}
		);

		User.addHook('beforeCreate', async (user: User) => {
			try {
				user.password = await hashPassword(user.password);
			} catch (dbError) {
				const databaseError =
					new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						`Failed to create hashed password: ${
							dbError instanceof Error
								? dbError.message
								: 'Unknown error'
						}`,
						{
							originalError: dbError
						}
					);
				errorLogger.logInfo(databaseError.message);
				errorHandler.handleError({ error: databaseError || dbError });
				throw databaseError;
			}
		});
	}
}

export function createUserModel(sequelize: Sequelize): typeof User {
	try {
		validateDependencies(
			[{ name: 'sequelize', instance: sequelize }],
			logger || console
		);
		User.initializeModel(sequelize);
		return User;
	} catch (dbError) {
		const databaseRecoverableError =
			new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
				`Failed to initialize User model: ${
					dbError instanceof Error ? dbError.message : 'Unknown error'
				}`,
				{ originalError: dbError || Error || null }
			);
		errorLogger.logInfo(databaseRecoverableError.message);
		errorHandler.handleError({
			error: databaseRecoverableError || dbError || Error || null
		});
		throw databaseRecoverableError;
	}
}
