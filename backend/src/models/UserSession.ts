import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';
import { Logger, setupLogger } from '../config/logger';

interface UserSessionAttributes {
	id: string; // UUID for the session record, primary key (from User model)
	sessionId: number; // auto-incremented session identifier
	ipAddress: string; // IP address associaed with the session
	userAgent: string; // user agent string of the session
	createdAt: Date; // timestamp when the session was created
	updatedAt?: Date | null; // optional timestamp for when the session was last updated
	expiresAt: Date; // timestamp for when the session expires
	isActive: boolean; // indicates if the session is currently active
}

class UserSession
	extends Model<
		InferAttributes<UserSession>,
		InferCreationAttributes<UserSession>
	>
	implements UserSessionAttributes
{
	id!: string; // initialized as a non-nullable string (UUID)
	sessionId!: number; // initialized as a non-nullable auto-incremented integer
	ipAddress!: string; // initialized as a non-nullable string, valid as an IP address
	userAgent!: string; // initialized as a non-nullable string
	createdAt!: CreationOptional<Date>; // optional field, dfaults to current date/time
	updatedAt!: Date | null; // nullable field, may contain a date or null
	expiresAt!: Date; // initialized as a non-nullable date
	isActive!: boolean; // initialized as a non-nullable boolean
}

const logger: Logger = setupLogger();

export default function createUserSessionModel(
	sequelize: Sequelize
): typeof UserSession {
	UserSession.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4, // default to a generated UUID from the User model
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			sessionId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true, // auto-incrementing unique session identifier
				allowNull: false,
				unique: true
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false, // IP address is required
				validate: {
					isIP: true // validate that the IP address is in a valid format
				}
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false // user agent string is required
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // defaults to current date/time
				allowNull: false // creation date is required
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: true, // last update date/time is optional
				defaultValue: undefined
			},
			expiresAt: {
				type: DataTypes.DATE,
				allowNull: false // expiration date/time is required
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true, // session is active by default
				allowNull: false // session status is required
			}
		},
		{
			sequelize,
			modelName: 'UserSession',
			timestamps: true, // automatically generate createdAt and updatedAt fields
			hooks: {
				beforeCreate: (session: UserSession) => {
					try {
						session.expiresAt = new Date(
							(session.createdAt as Date).getTime() + 60 * 60000
						); // default expiration time is 60 minutes after session generation
						logger.debug(
							'Session expiration time set to 60 minutes'
						);
					} catch (error) {
						if (error instanceof Error) {
							logger.error(
								'Error creating session in beforeCreate hook: ',
								{ stack: error.stack }
							);
							throw error;
						} else {
							logger.error(
								'Error creating session in beforeCreate hook: ',
								{ error }
							);
							throw error;
						}
					}
				},
				beforeUpdate: (session: UserSession) => {
					try {
						session.updatedAt = new Date(); // update the updatedAt field on every update
						logger.debug('Session updatedAt field updated');
					} catch (error) {
						if (error instanceof Error) {
							logger.error(
								'Error updating session in beforeUpdate hook: ',
								{ stack: error.stack }
							);
							throw error;
						} else {
							logger.error(
								'Error updating session in beforeUpdate hook: ',
								{ error }
							);
							throw error;
						}
					}
				}
			}
		}
	);

	return UserSession;
}
