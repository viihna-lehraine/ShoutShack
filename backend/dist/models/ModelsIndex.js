import argon2 from 'argon2';
import { getSequelizeInstance } from '../config/db.js';
import { DataTypes } from 'sequelize';
import AuditLog from './AuditLog.js';
import DataShareOptions from './DataShareOptions.js';
import Device from './Device.js';
import FailedLoginAttempts from './FailedLoginAttempts.js';
import FeatureRequest from './FeatureRequest.js';
import FeedbackSurvey from './FeedbackSurvey.js';
import GuestbookEntry from './GuestbookEntry.js';
import MultiFactorAuthSetup from './MultiFactorAuthSetup.js';
import RecoveryMethod from './RecoveryMethod.js';
import SecurityEvent from './SecurityEvent.js';
import SupportRequest from './SupportRequest.js';
import User from './User.js';
import UserMfa from './UserMfa.js';
import UserSession from './UserSession.js';
import getSecrets from '../config/sops.js';
import setupLogger from '../config/logger.js';
import { getFeatureFlags } from '../config/featureFlags.js';
const logger = setupLogger();
const featureFlags = getFeatureFlags();
const SEQUELIZE_LOGGING = featureFlags.sequelizeLoggingFlag;
export async function initializeModels() {
	const sequelize = getSequelizeInstance();
	const secrets = await getSecrets.getSecrets();
	if (SEQUELIZE_LOGGING) {
		logger.info(
			'initializeModels() in ModelsIndex: SEQUELIZE_LOGGING is true. Printing sequelize'
		);
		logger.info(`Sequelize: ${sequelize}`);
	} else {
		logger.info(
			'initializeModels() in ModelsIndex: SEQUELIZE_LOGGING is false. Not printing sequelize to console'
		);
	}
	console.log('Initializing User');
	User.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true
			},
			userid: {
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
			isAccountVerified: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			resetPasswordToken: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true
			},
			resetPasswordExpires: {
				type: DataTypes.DATE,
				defaultValue: undefined,
				allowNull: true
			},
			isMfaEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			creationDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			}
		},
		{
			sequelize,
			modelName: 'User',
			timestamps: false,
			hooks: {
				beforeCreate: async user => {
					try {
						user.password = await argon2.hash(
							user.password + secrets.PEPPER,
							{
								type: argon2.argon2id,
								memoryCost: 48640, // 47.5 MiB memory
								timeCost: 4, // 4 iterations
								parallelism: 1
							}
						);
					} catch (error) {
						if (error instanceof Error) {
							throw new Error(
								`Error hashing password: ${error.message}`
							);
						} else {
							throw new Error(
								'Unexpected error during password hashing.'
							);
						}
					}
				},
				// synchronize isMfaEnabled value with the associated id's value on the UserMfa table
				afterUpdate: async user => {
					if (user.changed('isMfaEnabled')) {
						await UserMfa.update(
							{ isMfaEnabled: user.isMfaEnabled },
							{ where: { id: user.id } }
						);
					}
				}
			}
		}
	);
	console.log('Initializing AuditLog');
	AuditLog.init(
		{
			auditId: {
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
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			actionType: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					isIn: [
						[
							'create',
							'update',
							'delete',
							'read',
							'login',
							'logout',
							'other'
						]
					]
				}
			},
			actionDescription: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			affectedResource: {
				type: DataTypes.STRING,
				allowNull: true
			},
			previousValue: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			newValue: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			auditLogDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			auditLogUpdateDate: {
				type: DataTypes.DATE,
				defaultValue: undefined,
				allowNull: true
			}
		},
		{
			sequelize,
			modelName: 'AuditLog',
			timestamps: true
		}
	);
	console.log('Initializing DataShareOptions');
	DataShareOptions.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			trackingPixelOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			featureUsageOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			pageViewsOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			interactionDataOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			deviceTypeOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			browserInfoOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			operatingSystemOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			randomAnonSurveyOption: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			lastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: true
			}
		},
		{
			sequelize,
			modelName: 'DataShareOptions',
			timestamps: true
		}
	);
	console.log('Initializing Device');
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
				primaryKey: true,
				allowNull: false,
				unique: true,
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
					isIn: [['desktop', 'laptop', 'tablet', 'mobile', 'other']]
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
				allowNull: false
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
			timestamps: true
		}
	);
	console.log('Initializing FailedLoginAttempts');
	FailedLoginAttempts.init(
		{
			attemptId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				unique: true
			},
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			attemptDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			isLocked: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			}
		},
		{
			sequelize,
			modelName: 'FailedLoginAttempts',
			timestamps: true
		}
	);
	console.log('Initializing FeedbackSurvey');
	FeedbackSurvey.init(
		{
			surveyId: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
				unique: true
			},
			questionGeneralApproval: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5
				}
			},
			questionServiceQuality: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5
				}
			},
			questionEaseOfUse: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5
				}
			},
			questionUserSupport: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0, // allows for N/A
					max: 5
				}
			},
			questionHelpGuides: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0, // allows for N/A
					max: 5
				}
			},
			questionIsPremiumUser: {
				type: DataTypes.BOOLEAN,
				allowNull: true
			},
			questionPremiumValue: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 0,
					max: 5
				}
			},
			questionLikelihoodToRecommend: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5
				}
			},
			questionUsefulFeaturesAndAspects: {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: []
			},
			questionFeaturesThatNeedImprovement: {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: []
			},
			questionOpenEndedLikeTheMost: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: ''
			},
			questionOpenEndedWhatCanWeImprove: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: ''
			},
			questionDemoHeardAboutUs: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 5
				}
			},
			questionDemoAgeGroup: {
				type: DataTypes.INTEGER,
				allowNull: true,
				validate: {
					min: 1,
					max: 7
				}
			},
			questionDemoGender: {
				type: DataTypes.STRING,
				allowNull: true
			},
			questionDemoRegion: {
				type: DataTypes.STRING,
				allowNull: true
			},
			questionDemoLangPref: {
				type: DataTypes.STRING,
				allowNull: true
			},
			questionFinalThoughts: {
				type: DataTypes.TEXT,
				allowNull: true,
				defaultValue: ''
			},
			hasOptedInForFollowUp: {
				type: DataTypes.BOOLEAN,
				allowNull: true,
				defaultValue: false
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: ''
			},
			surveyDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			}
		},
		{
			sequelize,
			modelName: 'FeedbackSurvey',
			timestamps: true
		}
	);
	console.log('Initializing FeatureRequest');
	FeatureRequest.init(
		{
			featureRequestNumber: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: true,
				unique: true
			},
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			email: {
				type: DataTypes.STRING,
				allowNull: true,
				defaultValue: undefined
			},
			featureRequestType: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: undefined
			},
			featureRequestContent: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: undefined
			},
			canFollowUpFeatureRequest: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			},
			featureRequestOpenDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			featureRequestCloseDate: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: undefined
			}
		},
		{
			sequelize,
			modelName: 'FeatureRequest',
			timestamps: true
		}
	);
	console.log('Initializing GuestbookEntry');
	GuestbookEntry.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			guestName: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: false
			},
			guestEmail: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: false
			},
			guestMessage: {
				type: DataTypes.TEXT,
				allowNull: false,
				unique: false
			},
			guestMessageStyles: {
				type: DataTypes.JSON,
				allowNull: true,
				unique: false
			},
			entryDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
				unique: false
			}
		},
		{
			sequelize,
			modelName: 'GuestbookEntry',
			timestamps: false
		}
	);
	console.log('Initializing MultiFactorAuthSetup');
	MultiFactorAuthSetup.init(
		{
			mfaId: {
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
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false
			},
			method: {
				type: DataTypes.ENUM(
					'totp',
					'email',
					'yubico',
					'fido2',
					'passkey'
				),
				allowNull: false
			},
			secret: {
				type: DataTypes.STRING,
				allowNull: true
			},
			publicKey: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			counter: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			}
		},
		{
			sequelize,
			modelName: 'MultiFactorAuthSetup',
			timestamps: true
		}
	);
	console.log('Initializing RecoveryMethod');
	RecoveryMethod.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			isRecoveryActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			recoveryId: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true
			},
			recoveryMethod: {
				type: DataTypes.ENUM('email', 'backupCodes'),
				allowNull: true
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			recoveryLastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: true
			}
		},
		{
			sequelize,
			modelName: 'RecoveryMethod',
			timestamps: true
		}
	);
	console.log('Initializing SecurityEvent');
	SecurityEvent.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			eventId: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				allowNull: true,
				unique: true
			},
			eventType: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					isIn: [
						[
							'login',
							'failed-login',
							'password-change',
							'2fa-enabled',
							'2fa-disabled',
							'account-lock',
							'other'
						]
					]
				}
			},
			eventDescription: {
				type: DataTypes.TEXT,
				allowNull: true
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			securityEventDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			securityEventLastUpdated: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			}
		},
		{
			sequelize,
			modelName: 'SecurityEvent',
			timestamps: true
		}
	);
	console.log('Initializing SupportRequest');
	SupportRequest.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false
			},
			supportTicketNumber: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				allowNull: true,
				unique: true
			},
			supportType: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			supportContent: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			isSupportTicketOpen: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false
			},
			supportTicketOpenDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			supportTicketCloseDate: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: undefined
			}
		},
		{
			sequelize,
			modelName: 'SupportRequest',
			timestamps: true
		}
	);
	console.log('Initializing UserMfa');
	UserMfa.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			isMfaEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			backupCodes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				defaultValue: undefined,
				allowNull: true
			},
			isEmail2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isTotpl2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isYubicoOtp2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isU2f2faEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			isPasskeyEnabled: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false
			},
			totpSecret: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			yubicoOtpPublicId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			yubicoOtpSecretKey: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			fido2CredentialId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			fido2PublicKey: {
				type: DataTypes.TEXT,
				defaultValue: undefined,
				allowNull: true
			},
			fido2Counter: {
				type: DataTypes.INTEGER,
				defaultValue: undefined,
				allowNull: true
			},
			fido2AttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true
			},
			passkeyCredentialId: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			passkeyPublicKey: {
				type: DataTypes.TEXT,
				defaultValue: undefined,
				allowNull: true,
				unique: true
			},
			passkeyCounter: {
				type: DataTypes.INTEGER,
				defaultValue: undefined,
				allowNull: true
			},
			passkeyAttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: undefined,
				allowNull: true
			}
		},
		{
			sequelize: getSequelizeInstance(),
			modelName: 'UserMfa',
			timestamps: true
		}
	);
	console.log('Initializing UserSession');
	UserSession.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
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
				autoIncrement: true,
				allowNull: false,
				unique: true
			},
			userId: {
				type: DataTypes.UUID,
				allowNull: false
			},
			ipAddress: {
				type: DataTypes.STRING,
				allowNull: false
			},
			userAgent: {
				type: DataTypes.STRING,
				allowNull: false
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			updatedAt: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: undefined
			},
			expiresAt: {
				type: DataTypes.DATE,
				allowNull: false
			},
			isActive: {
				type: DataTypes.BOOLEAN,
				defaultValue: true
			}
		},
		{
			sequelize,
			modelName: 'UserSession',
			timestamps: true,
			hooks: {
				beforeCreate: session => {
					session.expiresAt = new Date(
						session.createdAt.getTime() + 60 * 60000
					); // default expiration time is 60 minutes after session generation
				},
				beforeUpdate: session => {
					session.updatedAt = new Date(); // update the updatedAt field on every update
				}
			}
		}
	);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWxzSW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbW9kZWxzL01vZGVsc0luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDcEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLFFBQVEsTUFBTSxZQUFZLENBQUM7QUFDbEMsT0FBTyxnQkFBZ0IsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRCxPQUFPLE1BQU0sTUFBTSxVQUFVLENBQUM7QUFDOUIsT0FBTyxtQkFBbUIsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RCxPQUFPLGNBQWMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLGNBQWMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLGNBQWMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLG9CQUFvQixNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sY0FBYyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFDO0FBQzVDLE9BQU8sY0FBYyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sSUFBSSxNQUFNLFFBQVEsQ0FBQztBQUMxQixPQUFPLE9BQU8sTUFBTSxXQUFXLENBQUM7QUFDaEMsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sVUFBVSxNQUFNLGdCQUFnQixDQUFDO0FBQ3hDLE9BQU8sV0FBVyxNQUFNLGtCQUFrQixDQUFDO0FBQzNDLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUV6RCxNQUFNLE1BQU0sR0FBRyxXQUFXLEVBQUUsQ0FBQztBQUM3QixNQUFNLFlBQVksR0FBRyxlQUFlLEVBQUUsQ0FBQztBQUV2QyxNQUFNLGlCQUFpQixHQUFHLFlB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QUUsR0FBRyxLQUFLLENBQ2xELENBQUMsQ0FBQyxpRUFBaUU7WUFDckUsQ0FBQztZQUNELFlBQVksRUFBRSxPQUFPLENBQUMsRUFBRTtnQkFDdkIsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsNkNBQTZDO1lBQzlFLENBQUM7U0FDRDtLQUNELENBQ0QsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXJnb24yIGZyb20gJ2FyZ29uMic7XG5pbXBvcnQgeyBnZXRTZXF1ZWxpemVJbnN0YW5jZSB9IGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgeyBEYXRhVHlwZXMgfSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IEF1ZGl0TG9nIGZyb20gJy4vQXVkaXRMb2cnO1xuaW1wb3J0IERhdGFTaGFyZU9wdGlvbnMgZnJvbSAnLi9EYXRhU2hhcmVPcHRpb25zJztcbmltcG9ydCBEZXZpY2UgZnJvbSAnLi9EZXZpY2UnO1xuaW1wb3J0IEZhaWxlZExvZ2luQXR0ZW1wdHMgZnJvbSAnLi9GYWlsZWRMb2dpbkF0dGVtcHRzJztcbmltcG9ydCBGZWF0dXJlUmVxdWVzdCBmcm9tICcuL0ZlYXR1cmVSZXF1ZXN0JztcbmltcG9ydCBGZWVkYmFja1N1cnZleSBmcm9tICcuL0ZlZWRiYWNrU3VydmV5JztcbmltcG9ydCBHdWVzdGJvb2tFbnRyeSBmcm9tICcuL0d1ZXN0Ym9va0VudHJ5JztcbmltcG9ydCBNdWx0aUZhY3RvckF1dGhTZXR1cCBmcm9tICcuL011bHRpRmFjdG9yQXV0aFNldHVwJztcbmltcG9ydCBSZWNvdmVyeU1ldGhvZCBmcm9tICcuL1JlY292ZXJ5TWV0aG9kJztcbmltcG9ydCBTZWN1cml0eUV2ZW50IGZyb20gJy4vU2VjdXJpdHlFdmVudCc7XG5pbXBvcnQgU3VwcG9ydFJlcXVlc3QgZnJvbSAnLi9TdXBwb3J0UmVxdWVzdCc7XG5pbXBvcnQgVXNlciBmcm9tICcuL1VzZXInO1xuaW1wb3J0IFVzZXJNZmEgZnJvbSAnLi9Vc2VyTWZhJztcbmltcG9ydCBVc2VyU2Vzc2lvbiBmcm9tICcuL1VzZXJTZXNzaW9uJztcbmltcG9ydCBnZXRTZWNyZXRzIGZyb20gJy4uL2NvbmZpZy9zb3BzJztcbmltcG9ydCBzZXR1cExvZ2dlciBmcm9tICcuLi9jb25maWcvbG9nZ2VyJztcbmltcG9ydCB7IGdldEZlYXR1cmVGbGFncyB9IGZyb20gJy4uL2NvbmZpZy9mZWF0dXJlRmxhZ3MnO1xuXG5jb25zdCBsb2dnZXIgPSBzZXR1cExvZ2dlcigpO1xuY29uc3QgZmVhdHVyZUZsYWdzID0gZ2V0RmVhdHVyZUZsYWdzKCk7XG5cbmNvbnN0IFNFUVVFTElaRV9MT0dHSU5HID0gZmVhdHVyZUZsYWdzLnNlcXVlbGl6ZUxvZ2dpbmdGbGFnO1xuXG5pbnRlcmZhY2UgTW9kZWxzSW5kZXhTZWNyZXRzIHtcblx0UEVQUEVSOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0aWFsaXplTW9kZWxzKCk6IFByb21pc2U8dm9pZD4ge1xuXHRjb25zdCBzZXF1ZWxpemUgPSBnZXRTZXF1ZWxpemVJbnN0YW5jZSgpO1xuXHRjb25zdCBzZWNyZXRzOiBNb2RlbHNJbmRleFNlY3JldHMgPSBhd2FpdCBnZXRTZWNyZXRzLmdldFNlY3JldHMoKTtcblxuXHRpZiAoU0VRVUVMSVpFX0xPR0dJTkcpIHtcblx0XHRsb2dnZXIuaW5mbyhcblx0XHRcdCdpbml0aWFsaXplTW9kZWxzKCkgaW4gTW9kZWxzSW5kZXg6IFNFUVVFTElaRV9MT0dHSU5HIGlzIHRydWUuIFByaW50aW5nIHNlcXVlbGl6ZSdcblx0XHQpO1xuXHRcdGxvZ2dlci5pbmZvKGBTZXF1ZWxpemU6ICR7c2VxdWVsaXplfWApO1xuXHR9IGVsc2Uge1xuXHRcdGxvZ2dlci5pbmZvKFxuXHRcdFx0J2luaXRpYWxpemVNb2RlbHMoKSBpbiBNb2RlbHNJbmRleDogU0VRVUVMSVpFX0xPR0dJTkcgaXMgZmFsc2UuIE5vdCBwcmludGluZyBzZXF1ZWxpemUgdG8gY29uc29sZSdcblx0XHQpO1xuXHR9XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBVc2VyJyk7XG5cdFVzZXIuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR1c2VyaWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJuYW1lOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHBhc3N3b3JkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRlbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc0FjY291bnRWZXJpZmllZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHJlc2V0UGFzc3dvcmRUb2tlbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cmVzZXRQYXNzd29yZEV4cGlyZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc01mYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGlvbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnVXNlcicsXG5cdFx0XHR0aW1lc3RhbXBzOiBmYWxzZSxcblx0XHRcdGhvb2tzOiB7XG5cdFx0XHRcdGJlZm9yZUNyZWF0ZTogYXN5bmMgKHVzZXI6IFVzZXIpID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0dXNlci5wYXNzd29yZCA9IGF3YWl0IGFyZ29uMi5oYXNoKFxuXHRcdFx0XHRcdFx0XHR1c2VyLnBhc3N3b3JkICsgc2VjcmV0cy5QRVBQRVIsXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHR0eXBlOiBhcmdvbjIuYXJnb24yaWQsXG5cdFx0XHRcdFx0XHRcdFx0bWVtb3J5Q29zdDogNDg2NDAsIC8vIDQ3LjUgTWlCIG1lbW9yeVxuXHRcdFx0XHRcdFx0XHRcdHRpbWVDb3N0OiA0LCAvLyA0IGl0ZXJhdGlvbnNcblx0XHRcdFx0XHRcdFx0XHRwYXJhbGxlbGlzbTogMVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG5cdFx0XHRcdFx0XHRpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRcdFx0YEVycm9yIGhhc2hpbmcgcGFzc3dvcmQ6ICR7ZXJyb3IubWVzc2FnZX1gXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRcdFx0J1VuZXhwZWN0ZWQgZXJyb3IgZHVyaW5nIHBhc3N3b3JkIGhhc2hpbmcuJ1xuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0Ly8gc3luY2hyb25pemUgaXNNZmFFbmFibGVkIHZhbHVlIHdpdGggdGhlIGFzc29jaWF0ZWQgaWQncyB2YWx1ZSBvbiB0aGUgVXNlck1mYSB0YWJsZVxuXHRcdFx0XHRhZnRlclVwZGF0ZTogYXN5bmMgKHVzZXI6IFVzZXIpID0+IHtcblx0XHRcdFx0XHRpZiAodXNlci5jaGFuZ2VkKCdpc01mYUVuYWJsZWQnKSkge1xuXHRcdFx0XHRcdFx0YXdhaXQgVXNlck1mYS51cGRhdGUoXG5cdFx0XHRcdFx0XHRcdHsgaXNNZmFFbmFibGVkOiB1c2VyLmlzTWZhRW5hYmxlZCB9LFxuXHRcdFx0XHRcdFx0XHR7IHdoZXJlOiB7IGlkOiB1c2VyLmlkIH0gfVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBBdWRpdExvZycpO1xuXHRBdWRpdExvZy5pbml0KFxuXHRcdHtcblx0XHRcdGF1ZGl0SWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YWN0aW9uVHlwZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdGlzSW46IFtcblx0XHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdFx0J2NyZWF0ZScsXG5cdFx0XHRcdFx0XHRcdCd1cGRhdGUnLFxuXHRcdFx0XHRcdFx0XHQnZGVsZXRlJyxcblx0XHRcdFx0XHRcdFx0J3JlYWQnLFxuXHRcdFx0XHRcdFx0XHQnbG9naW4nLFxuXHRcdFx0XHRcdFx0XHQnbG9nb3V0Jyxcblx0XHRcdFx0XHRcdFx0J290aGVyJ1xuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdF1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGFjdGlvbkRlc2NyaXB0aW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRhZmZlY3RlZFJlc291cmNlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHByZXZpb3VzVmFsdWU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdG5ld1ZhbHVlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpcEFkZHJlc3M6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJBZ2VudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YXVkaXRMb2dEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRhdWRpdExvZ1VwZGF0ZURhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0F1ZGl0TG9nJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBEYXRhU2hhcmVPcHRpb25zJyk7XG5cdERhdGFTaGFyZU9wdGlvbnMuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRyYWNraW5nUGl4ZWxPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlVXNhZ2VPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRwYWdlVmlld3NPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpbnRlcmFjdGlvbkRhdGFPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRkZXZpY2VUeXBlT3B0aW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YnJvd3NlckluZm9PcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRvcGVyYXRpbmdTeXN0ZW1PcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRyYW5kb21Bbm9uU3VydmV5T3B0aW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0bGFzdFVwZGF0ZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdEYXRhU2hhcmVPcHRpb25zJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBEZXZpY2UnKTtcblx0RGV2aWNlLmluaXQoXG5cdFx0e1xuXHRcdFx0ZGV2aWNlSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZGV2aWNlTmFtZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRkZXZpY2VUeXBlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRpc0luOiBbWydkZXNrdG9wJywgJ2xhcHRvcCcsICd0YWJsZXQnLCAnbW9iaWxlJywgJ290aGVyJ11dXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRicm93c2VyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlwQWRkcmVzczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0bGFzdFVzZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXNUcnVzdGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y3JlYXRpb25EYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRsYXN0VXBkYXRlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0RldmljZScsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgRmFpbGVkTG9naW5BdHRlbXB0cycpO1xuXHRGYWlsZWRMb2dpbkF0dGVtcHRzLmluaXQoXG5cdFx0e1xuXHRcdFx0YXR0ZW1wdElkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1c2VyQWdlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGF0dGVtcHREYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc0xvY2tlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnRmFpbGVkTG9naW5BdHRlbXB0cycsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgRmVlZGJhY2tTdXJ2ZXknKTtcblx0RmVlZGJhY2tTdXJ2ZXkuaW5pdChcblx0XHR7XG5cdFx0XHRzdXJ2ZXlJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25HZW5lcmFsQXBwcm92YWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvblNlcnZpY2VRdWFsaXR5OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25FYXNlT2ZVc2U6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvblVzZXJTdXBwb3J0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAwLCAvLyBhbGxvd3MgZm9yIE4vQVxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25IZWxwR3VpZGVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAwLCAvLyBhbGxvd3MgZm9yIE4vQVxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25Jc1ByZW1pdW1Vc2VyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvblByZW1pdW1WYWx1ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMCxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uTGlrZWxpaG9vZFRvUmVjb21tZW5kOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25Vc2VmdWxGZWF0dXJlc0FuZEFzcGVjdHM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkpTT04sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBbXVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRmVhdHVyZXNUaGF0TmVlZEltcHJvdmVtZW50OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5KU09OLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogW11cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbk9wZW5FbmRlZExpa2VUaGVNb3N0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogJydcblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbk9wZW5FbmRlZFdoYXRDYW5XZUltcHJvdmU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiAnJ1xuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRGVtb0hlYXJkQWJvdXRVczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMSxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRGVtb0FnZUdyb3VwOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogN1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vR2VuZGVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRGVtb1JlZ2lvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkRlbW9MYW5nUHJlZjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkZpbmFsVGhvdWdodHM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiAnJ1xuXHRcdFx0fSxcblx0XHRcdGhhc09wdGVkSW5Gb3JGb2xsb3dVcDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0ZW1haWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6ICcnXG5cdFx0XHR9LFxuXHRcdFx0c3VydmV5RGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdGZWVkYmFja1N1cnZleScsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgRmVhdHVyZVJlcXVlc3QnKTtcblx0RmVhdHVyZVJlcXVlc3QuaW5pdChcblx0XHR7XG5cdFx0XHRmZWF0dXJlUmVxdWVzdE51bWJlcjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGVtYWlsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWRcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlUmVxdWVzdFR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkXG5cdFx0XHR9LFxuXHRcdFx0ZmVhdHVyZVJlcXVlc3RDb250ZW50OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZFxuXHRcdFx0fSxcblx0XHRcdGNhbkZvbGxvd1VwRmVhdHVyZVJlcXVlc3Q6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlUmVxdWVzdE9wZW5EYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlUmVxdWVzdENsb3NlRGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnRmVhdHVyZVJlcXVlc3QnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIEd1ZXN0Ym9va0VudHJ5Jyk7XG5cdEd1ZXN0Ym9va0VudHJ5LmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRndWVzdE5hbWU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Z3Vlc3RFbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRndWVzdE1lc3NhZ2U6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRndWVzdE1lc3NhZ2VTdHlsZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkpTT04sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGVudHJ5RGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdHdWVzdGJvb2tFbnRyeScsXG5cdFx0XHR0aW1lc3RhbXBzOiBmYWxzZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIE11bHRpRmFjdG9yQXV0aFNldHVwJyk7XG5cdE11bHRpRmFjdG9yQXV0aFNldHVwLmluaXQoXG5cdFx0e1xuXHRcdFx0bWZhSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dXNlcklkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0bWV0aG9kOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5FTlVNKFxuXHRcdFx0XHRcdCd0b3RwJyxcblx0XHRcdFx0XHQnZW1haWwnLFxuXHRcdFx0XHRcdCd5dWJpY28nLFxuXHRcdFx0XHRcdCdmaWRvMicsXG5cdFx0XHRcdFx0J3Bhc3NrZXknXG5cdFx0XHRcdCksXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzZWNyZXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cHVibGljS2V5OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRjb3VudGVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc0FjdGl2ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y3JlYXRlZEF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1cGRhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnTXVsdGlGYWN0b3JBdXRoU2V0dXAnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIFJlY292ZXJ5TWV0aG9kJyk7XG5cdFJlY292ZXJ5TWV0aG9kLmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRpc1JlY292ZXJ5QWN0aXZlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0cmVjb3ZlcnlJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRyZWNvdmVyeU1ldGhvZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuRU5VTSgnZW1haWwnLCAnYmFja3VwQ29kZXMnKSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YmFja3VwQ29kZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkFSUkFZKERhdGFUeXBlcy5TVFJJTkcpLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRyZWNvdmVyeUxhc3RVcGRhdGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnUmVjb3ZlcnlNZXRob2QnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIFNlY3VyaXR5RXZlbnQnKTtcblx0U2VjdXJpdHlFdmVudC5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRldmVudFR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRpc0luOiBbXG5cdFx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRcdCdsb2dpbicsXG5cdFx0XHRcdFx0XHRcdCdmYWlsZWQtbG9naW4nLFxuXHRcdFx0XHRcdFx0XHQncGFzc3dvcmQtY2hhbmdlJyxcblx0XHRcdFx0XHRcdFx0JzJmYS1lbmFibGVkJyxcblx0XHRcdFx0XHRcdFx0JzJmYS1kaXNhYmxlZCcsXG5cdFx0XHRcdFx0XHRcdCdhY2NvdW50LWxvY2snLFxuXHRcdFx0XHRcdFx0XHQnb3RoZXInXG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0XVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnREZXNjcmlwdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1c2VyQWdlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHNlY3VyaXR5RXZlbnREYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzZWN1cml0eUV2ZW50TGFzdFVwZGF0ZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnU2VjdXJpdHlFdmVudCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgU3VwcG9ydFJlcXVlc3QnKTtcblx0U3VwcG9ydFJlcXVlc3QuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGVtYWlsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzdXBwb3J0VGlja2V0TnVtYmVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUeXBlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c3VwcG9ydENvbnRlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1N1cHBvcnRUaWNrZXRPcGVuOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzdXBwb3J0VGlja2V0T3BlbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUaWNrZXRDbG9zZURhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWRcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ1N1cHBvcnRSZXF1ZXN0Jyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBVc2VyTWZhJyk7XG5cdFVzZXJNZmEuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGlzTWZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGJhY2t1cENvZGVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5BUlJBWShEYXRhVHlwZXMuU1RSSU5HKSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlzRW1haWwyZmFFbmFibGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0aXNUb3RwbDJmYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1l1Ymljb090cDJmYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1UyZjJmYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1Bhc3NrZXlFbmFibGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dG90cFNlY3JldDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR5dWJpY29PdHBQdWJsaWNJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR5dWJpY29PdHBTZWNyZXRLZXk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0ZmlkbzJDcmVkZW50aWFsSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0ZmlkbzJQdWJsaWNLZXk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRmaWRvMkNvdW50ZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRmaWRvMkF0dGVzdGF0aW9uRm9ybWF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwYXNza2V5Q3JlZGVudGlhbElkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHBhc3NrZXlQdWJsaWNLZXk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHBhc3NrZXlDb3VudGVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGFzc2tleUF0dGVzdGF0aW9uRm9ybWF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZTogZ2V0U2VxdWVsaXplSW5zdGFuY2UoKSxcblx0XHRcdG1vZGVsTmFtZTogJ1VzZXJNZmEnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIFVzZXJTZXNzaW9uJyk7XG5cdFVzZXJTZXNzaW9uLmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRzZXNzaW9uSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlwQWRkcmVzczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dXNlckFnZW50OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVwZGF0ZWRBdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZFxuXHRcdFx0fSxcblx0XHRcdGV4cGlyZXNBdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzQWN0aXZlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ1VzZXJTZXNzaW9uJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWUsXG5cdFx0XHRob29rczoge1xuXHRcdFx0XHRiZWZvcmVDcmVhdGU6IHNlc3Npb24gPT4ge1xuXHRcdFx0XHRcdHNlc3Npb24uZXhwaXJlc0F0ID0gbmV3IERhdGUoXG5cdFx0XHRcdFx0XHQoc2Vzc2lvbi5jcmVhdGVkQXQgYXMgRGF0ZSkuZ2V0VGltZSgpICsgNjAgKiA2MDAwMFxuXHRcdFx0XHRcdCk7IC8vIGRlZmF1bHQgZXhwaXJhdGlvbiB0aW1lIGlzIDYwIG1pbnV0ZXMgYWZ0ZXIgc2Vzc2lvbiBnZW5lcmF0aW9uXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGJlZm9yZVVwZGF0ZTogc2Vzc2lvbiA9PiB7XG5cdFx0XHRcdFx0c2Vzc2lvbi51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpOyAvLyB1cGRhdGUgdGhlIHVwZGF0ZWRBdCBmaWVsZCBvbiBldmVyeSB1cGRhdGVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0KTtcbn1cbiJdfQ==
