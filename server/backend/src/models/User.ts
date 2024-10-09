import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { UserAttributesInterface } from '../index/interfaces/models';
import { ServiceFactory } from '../index/factory/ServiceFactory';

const errorLogger = await ServiceFactory.getErrorLoggerService();
const errorHandler = await ServiceFactory.getErrorHandlerService();
const databaseController = await ServiceFactory.getDatabaseController();

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
	public isMFAEnabled!: boolean;
	public totpSecret?: string | null | undefined;
	public emailMFASecret?: string | null | undefined;
	public emailMFAToken?: string | null | undefined;
	public emailMFATokenExpires?: Date | null | undefined;
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
				isMFAEnabled: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				totpSecret: {
					type: DataTypes.STRING,
					allowNull: true
				},
				emailMFASecret: {
					type: DataTypes.STRING,
					allowNull: true
				},
				emailMFAToken: {
					type: DataTypes.STRING,
					allowNull: true
				},
				emailMFATokenExpires: {
					type: DataTypes.DATE,
					allowNull: true
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
	}
}

export async function createUserModel(): Promise<typeof User> {
	try {
		const sequelize = databaseController.getSequelizeInstance();

		if (!sequelize) {
			const databaseError =
				new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
					`Failed to initialize User model: Sequelize instance not found`,
					{
						exposeToClient: false
					}
				);
			errorLogger.logInfo(databaseError.message);
			errorHandler.handleError({ error: databaseError });
			throw databaseError;
		}

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
