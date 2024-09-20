import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize
} from 'sequelize';
import { User } from './UserModelFile';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/appLogger';
import { validateDependencies } from '../utils/validateDependencies';

interface DeviceAttributes {
	deviceId: number; // primary key, auto-incremented
	id: string; // foreign key to the User model
	deviceName: string;
	deviceType: string;
	os: string;
	browser?: string | null;
	ipAddress: string;
	lastUsed: Date;
	isTrusted: boolean;
	creationDate: Date;
	lastUpdated: Date;
}

class Device
	extends Model<InferAttributes<Device>, InferCreationAttributes<Device>>
	implements DeviceAttributes
{
	public deviceId!: number;
	public id!: string;
	public deviceName!: string;
	public deviceType!: string;
	public os!: string;
	public browser!: string | null;
	public ipAddress!: string;
	public lastUsed!: CreationOptional<Date>;
	public isTrusted!: boolean;
	public creationDate!: CreationOptional<Date>;
	public lastUpdated!: CreationOptional<Date>;
}

export default function createDeviceModel(
	sequelize: Sequelize,
	logger: Logger
): typeof Device | null {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);

		Device.init(
			{
				deviceId: {
					type: DataTypes.INTEGER,
					primaryKey: true,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					allowNull: false,
					references: {
						model: User,
						key: 'id'
					}
				},
				deviceName: {
					type: DataTypes.STRING,
					allowNull: true
				},
				deviceType: {
					type: DataTypes.STRING,
					allowNull: true,
					validate: {
						isIn: [
							['desktop', 'laptop', 'tablet', 'mobile', 'other']
						]
					}
				},
				os: {
					type: DataTypes.STRING,
					allowNull: true
				},
				browser: {
					type: DataTypes.STRING,
					allowNull: true
				},
				ipAddress: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIP: true
					}
				},
				lastUsed: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: true
				},
				isTrusted: {
					type: DataTypes.BOOLEAN,
					defaultValue: false
				},
				creationDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				lastUpdated: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'Device',
				timestamps: true,
				updatedAt: 'lastUpdated'
			}
		);

		logger.info('Device model initialized successfully');
		return Device;
	} catch (dbError) {
		const databaseError = new errorClasses.DatabaseErrorRecoverable(
			`Failed to initialize Device model: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
			{
				exposeToClient: false
			}
		);
		ErrorLogger.logInfo(databaseError.message, logger);
		processError(databaseError, logger);
		return null;
	}
}

export { Device };
