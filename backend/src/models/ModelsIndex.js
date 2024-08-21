import { __awaiter } from 'tslib';
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
import getSecrets from '../config/secrets.js';
export function initializeModels() {
	let sequelize = getSequelizeInstance();
	// console.log('Sequelize instance: ', sequelize);
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
				defaultValue: null,
				allowNull: true
			},
			resetPasswordExpires: {
				type: DataTypes.DATE,
				defaultValue: null,
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
				beforeCreate: (user) =>
					__awaiter(this, void 0, void 0, function* () {
						try {
							let secrets = yield getSecrets();
							user.password = yield argon2.hash(
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
									'Error hashing password: ' + error.message
								);
							} else {
								throw new Error(
									'Unexpected error during password hashing.'
								);
							}
						}
					}),
				// synchronize isMfaEnabled value with the associated id's value on the UserMfa table
				afterUpdate: (user) =>
					__awaiter(this, void 0, void 0, function* () {
						if (user.changed('isMfaEnabled')) {
							yield UserMfa.update(
								{ isMfaEnabled: user.isMfaEnabled },
								{ where: { id: user.id } }
							);
						}
					})
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
				defaultValue: null,
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
				defaultValue: null
			},
			featureRequestType: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: null
			},
			featureRequestContent: {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: null
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
				defaultValue: null
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
				defaultValue: null
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
				defaultValue: null,
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
				defaultValue: null,
				allowNull: true,
				unique: true
			},
			yubicoOtpPublicId: {
				type: DataTypes.STRING,
				defaultValue: null,
				allowNull: true,
				unique: true
			},
			yubicoOtpSecretKey: {
				type: DataTypes.STRING,
				defaultValue: null,
				allowNull: true,
				unique: true
			},
			fido2CredentialId: {
				type: DataTypes.STRING,
				defaultValue: null,
				allowNull: true,
				unique: true
			},
			fido2PublicKey: {
				type: DataTypes.TEXT,
				defaultValue: null,
				allowNull: true
			},
			fido2Counter: {
				type: DataTypes.INTEGER,
				defaultValue: null,
				allowNull: true
			},
			fido2AttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: null,
				allowNull: true
			},
			passkeyCredentialId: {
				type: DataTypes.STRING,
				defaultValue: null,
				allowNull: true,
				unique: true
			},
			passkeyPublicKey: {
				type: DataTypes.TEXT,
				defaultValue: null,
				allowNull: true,
				unique: true
			},
			passkeyCounter: {
				type: DataTypes.INTEGER,
				defaultValue: null,
				allowNull: true
			},
			passkeyAttestationFormat: {
				type: DataTypes.STRING,
				defaultValue: null,
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
				defaultValue: null
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
				beforeCreate: (session) => {
					session.expiresAt = new Date(
						session.createdAt.getTime() + 60 * 60000
					); // default expiration time is 60 minutes after session generation
				},
				beforeUpdate: (session) => {
					session.updatedAt = new Date(); // update the updatedAt field on every update
				}
			}
		}
	);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWxzSW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvTW9kZWxzSW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDcEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLFFBQVEsTUFBTSxZQUFZLENBQUM7QUFDbEMsT0FBTyxnQkFBZ0IsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRCxPQUFPLE1BQU0sTUFBTSxVQUFVLENBQUM7QUFDOUIsT0FBTyxtQkFBbUIsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RCxPQUFPLGNBQWMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLGNBQWMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLGNBQWMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLG9CQUFvQixNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sY0FBYyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFDO0FBQzVDLE9BQU8sY0FBYyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sSUFBSSxNQUFNLFFBQVEsQ0FBQztBQUMxQixPQUFPLE9BQU8sTUFBTSxXQUFXLENBQUM7QUFDaEMsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sVUFBVSxNQUFNLG1CQUFtQixDQUFDO0FBRTNDLE1BQU0sVUFBVSxnQkFBZ0I7SUFDL0IsSUFBSSxTQUFTLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztJQUN2QyxrREFBa0Q7SUFFbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQ1I7UUFDQyxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQzlCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxNQUFNLEVBQUU7WUFDUCxJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsYUFBYSxFQUFFLElBQUk7WUFDbkIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDWjtRQUNELFFBQVEsRUFBRTtZQUNULElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsS0FBSztZQUNoQixNQUFNLEVBQUUsSUFBSTtTQUNaO1FBQ0QsUUFBUSxFQUFFO1lBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsS0FBSyxFQUFFO1lBQ04sSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxpQkFBaUIsRUFBRTtZQUNsQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsWUFBWSxFQUFFLEtBQUs7U0FDbkI7UUFDRCxrQkFBa0IsRUFBRTtZQUNuQixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsWUFBWSxFQUFFLElBQUk7WUFDbEIsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELG9CQUFvQixFQUFFO1lBQ3JCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsSUFBSTtZQUNsQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsWUFBWSxFQUFFO1lBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsWUFBWSxFQUFFO1lBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsS0FBSztTQUNoQjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLE1BQU07UUFDakIsVUFBVSxFQUFFLEtBQUs7UUFDakIsS0FBSyxFQUFFO1lBQ04sWUFBWSxFQUFFLENBQU8sSUFBVSxFQUFFLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQztvQkFDSixJQUFJLE9BQU8sR0FBRyxNQUFNLFVBQVUsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUM5Qjt3QkFDQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVE7d0JBQ3JCLFVBQVUsRUFBRSxLQUFLLEVBQUUsa0JBQWtCO3dCQUNyQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLGVBQWU7d0JBQzVCLFdBQVcsRUFBRSxDQUFDO3FCQUNkLENBQ0QsQ0FBQztnQkFDSCxDQUFDO2dCQUFDLE9BQU8sS0FBYyxFQUFFLENBQUM7b0JBQ3pCLElBQUksS0FBSyxZQUFZLEtBQUssRUFBRSxDQUFDO3dCQUM1QixNQUFNLElBQUksS0FBSyxDQUNkLDBCQUEwQixHQUFHLEtBQUssQ0FBQyxPQUFPLENBQzFDLENBQUM7b0JBQ0gsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sSUFBSSxLQUFLLENBQ2QsMkNBQTJDLENBQzNDLENBQUM7b0JBQ0gsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFBO1lBQ0QscUZBQXFGO1lBQ3JGLFdBQVcsRUFBRSxDQUFPLElBQVUsRUFBRSxFQUFFO2dCQUNqQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztvQkFDbEMsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUNuQixFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQ25DLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUMxQixDQUFDO2dCQUNILENBQUM7WUFDRixDQUFDLENBQUE7U0FDRDtLQUNELENBQ0QsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUNyQyxRQUFRLENBQUMsSUFBSSxDQUNaO1FBQ0MsT0FBTyxFQUFFO1lBQ1IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQzlCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1lBQ1osVUFBVSxFQUFFO2dCQUNYLEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2FBQ1Q7U0FDRDtRQUNELFVBQVUsRUFBRTtZQUNYLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsS0FBSztZQUNoQixRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFO29CQUNMO3dCQUNDLFFBQVE7d0JBQ1IsUUFBUTt3QkFDUixRQUFRO3dCQUNSLE1BQU07d0JBQ04sT0FBTzt3QkFDUCxRQUFRO3dCQUNSLE9BQU87cUJBQ1A7aUJBQ0Q7YUFDRDtTQUNEO1FBQ0QsaUJBQWlCLEVBQUU7WUFDbEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFNBQVMsRUFBRSxJQUFJO1NBQ2Y7UUFDRCxnQkFBZ0IsRUFBRTtZQUNqQixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELGFBQWEsRUFBRTtZQUNkLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsUUFBUSxFQUFFO1lBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFNBQVMsRUFBRSxJQUFJO1NBQ2Y7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxZQUFZLEVBQUU7WUFDYixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO1lBQzNCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0Qsa0JBQWtCLEVBQUU7WUFDbkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxJQUFJO1NBQ2Y7S0FDRCxFQUNEO1FBQ0MsU0FBUztRQUNULFNBQVMsRUFBRSxVQUFVO1FBQ3JCLFVBQVUsRUFBRSxJQUFJO0tBQ2hCLENBQ0QsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQztJQUM3QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQ3BCO1FBQ0MsRUFBRSxFQUFFO1lBQ0gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUM5QixVQUFVLEVBQUUsSUFBSTtZQUNoQixTQUFTLEVBQUUsS0FBSztZQUNoQixNQUFNLEVBQUUsSUFBSTtZQUNaLFVBQVUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsSUFBSTtnQkFDWCxHQUFHLEVBQUUsSUFBSTthQUNUO1NBQ0Q7UUFDRCxtQkFBbUIsRUFBRTtZQUNwQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsWUFBWSxFQUFFLEtBQUs7U0FDbkI7UUFDRCxrQkFBa0IsRUFBRTtZQUNuQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsWUFBWSxFQUFFLEtBQUs7U0FDbkI7UUFDRCxlQUFlLEVBQUU7WUFDaEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ25CO1FBQ0QscUJBQXFCLEVBQUU7WUFDdEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ25CO1FBQ0QsZ0JBQWdCLEVBQUU7WUFDakIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ25CO1FBQ0QsaUJBQWlCLEVBQUU7WUFDbEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ25CO1FBQ0QscUJBQXFCLEVBQUU7WUFDdEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ25CO1FBQ0Qsc0JBQXNCLEVBQUU7WUFDdkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ25CO1FBQ0QsV0FBVyxFQUFFO1lBQ1osSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsSUFBSTtTQUNmO0tBQ0QsRUFDRDtRQUNDLFNBQVM7UUFDVCxTQUFTLEVBQUUsa0JBQWtCO1FBQzdCLFVBQVUsRUFBRSxJQUFJO0tBQ2hCLENBQ0QsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUNuQyxNQUFNLENBQUMsSUFBSSxDQUNWO1FBQ0MsUUFBUSxFQUFFO1lBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQzlCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1lBQ1osVUFBVSxFQUFFO2dCQUNYLEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2FBQ1Q7U0FDRDtRQUNELFVBQVUsRUFBRTtZQUNYLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsVUFBVSxFQUFFO1lBQ1gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsUUFBUSxFQUFFO2dCQUNULElBQUksRUFBRSxDQUFDLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzFEO1NBQ0Q7UUFDRCxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELE9BQU8sRUFBRTtZQUNSLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsUUFBUSxFQUFFO1lBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1NBQ25CO1FBQ0QsWUFBWSxFQUFFO1lBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELFdBQVcsRUFBRTtZQUNaLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7WUFDM0IsU0FBUyxFQUFFLElBQUk7U0FDZjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLFFBQVE7UUFDbkIsVUFBVSxFQUFFLElBQUk7S0FDaEIsQ0FDRCxDQUFDO0lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBQ2hELG1CQUFtQixDQUFDLElBQUksQ0FDdkI7UUFDQyxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLElBQUk7WUFDbkIsU0FBUyxFQUFFLElBQUk7WUFDZixNQUFNLEVBQUUsSUFBSTtTQUNaO1FBQ0QsRUFBRSxFQUFFO1lBQ0gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUM5QixTQUFTLEVBQUUsS0FBSztZQUNoQixNQUFNLEVBQUUsSUFBSTtZQUNaLFVBQVUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsSUFBSTtnQkFDWCxHQUFHLEVBQUUsSUFBSTthQUNUO1NBQ0Q7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxXQUFXLEVBQUU7WUFDWixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO1lBQzNCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsUUFBUSxFQUFFO1lBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1NBQ25CO0tBQ0QsRUFDRDtRQUNDLFNBQVM7UUFDVCxTQUFTLEVBQUUscUJBQXFCO1FBQ2hDLFVBQVUsRUFBRSxJQUFJO0tBQ2hCLENBQ0QsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUMzQyxjQUFjLENBQUMsSUFBSSxDQUNsQjtRQUNDLFFBQVEsRUFBRTtZQUNULElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixVQUFVLEVBQUUsSUFBSTtZQUNoQixhQUFhLEVBQUUsSUFBSTtZQUNuQixTQUFTLEVBQUUsS0FBSztZQUNoQixNQUFNLEVBQUUsSUFBSTtTQUNaO1FBQ0QsdUJBQXVCLEVBQUU7WUFDeEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsUUFBUSxFQUFFO2dCQUNULEdBQUcsRUFBRSxDQUFDO2dCQUNOLEdBQUcsRUFBRSxDQUFDO2FBQ047U0FDRDtRQUNELHNCQUFzQixFQUFFO1lBQ3ZCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixTQUFTLEVBQUUsSUFBSTtZQUNmLFFBQVEsRUFBRTtnQkFDVCxHQUFHLEVBQUUsQ0FBQztnQkFDTixHQUFHLEVBQUUsQ0FBQzthQUNOO1NBQ0Q7UUFDRCxpQkFBaUIsRUFBRTtZQUNsQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsU0FBUyxFQUFFLElBQUk7WUFDZixRQUFRLEVBQUU7Z0JBQ1QsR0FBRyxFQUFFLENBQUM7Z0JBQ04sR0FBRyxFQUFFLENBQUM7YUFDTjtTQUNEO1FBQ0QsbUJBQW1CLEVBQUU7WUFDcEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsUUFBUSxFQUFFO2dCQUNULEdBQUcsRUFBRSxDQUFDLEVBQUUsaUJBQWlCO2dCQUN6QixHQUFHLEVBQUUsQ0FBQzthQUNOO1NBQ0Q7UUFDRCxrQkFBa0IsRUFBRTtZQUNuQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsU0FBUyxFQUFFLElBQUk7WUFDZixRQUFRLEVBQUU7Z0JBQ1QsR0FBRyxFQUFFLENBQUMsRUFBRSxpQkFBaUI7Z0JBQ3pCLEdBQUcsRUFBRSxDQUFDO2FBQ047U0FDRDtRQUNELHFCQUFxQixFQUFFO1lBQ3RCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0Qsb0JBQW9CLEVBQUU7WUFDckIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsUUFBUSxFQUFFO2dCQUNULEdBQUcsRUFBRSxDQUFDO2dCQUNOLEdBQUcsRUFBRSxDQUFDO2FBQ047U0FDRDtRQUNELDZCQUE2QixFQUFFO1lBQzlCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixTQUFTLEVBQUUsSUFBSTtZQUNmLFFBQVEsRUFBRTtnQkFDVCxHQUFHLEVBQUUsQ0FBQztnQkFDTixHQUFHLEVBQUUsQ0FBQzthQUNOO1NBQ0Q7UUFDRCxnQ0FBZ0MsRUFBRTtZQUNqQyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsRUFBRTtTQUNoQjtRQUNELG1DQUFtQyxFQUFFO1lBQ3BDLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsSUFBSTtZQUNmLFlBQVksRUFBRSxFQUFFO1NBQ2hCO1FBQ0QsNEJBQTRCLEVBQUU7WUFDN0IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsWUFBWSxFQUFFLEVBQUU7U0FDaEI7UUFDRCxpQ0FBaUMsRUFBRTtZQUNsQyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsRUFBRTtTQUNoQjtRQUNELHdCQUF3QixFQUFFO1lBQ3pCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixTQUFTLEVBQUUsSUFBSTtZQUNmLFFBQVEsRUFBRTtnQkFDVCxHQUFHLEVBQUUsQ0FBQztnQkFDTixHQUFHLEVBQUUsQ0FBQzthQUNOO1NBQ0Q7UUFDRCxvQkFBb0IsRUFBRTtZQUNyQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsU0FBUyxFQUFFLElBQUk7WUFDZixRQUFRLEVBQUU7Z0JBQ1QsR0FBRyxFQUFFLENBQUM7Z0JBQ04sR0FBRyxFQUFFLENBQUM7YUFDTjtTQUNEO1FBQ0Qsa0JBQWtCLEVBQUU7WUFDbkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxJQUFJO1NBQ2Y7UUFDRCxrQkFBa0IsRUFBRTtZQUNuQixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELG9CQUFvQixFQUFFO1lBQ3JCLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QscUJBQXFCLEVBQUU7WUFDdEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsWUFBWSxFQUFFLEVBQUU7U0FDaEI7UUFDRCxxQkFBcUIsRUFBRTtZQUN0QixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsS0FBSztTQUNuQjtRQUNELEtBQUssRUFBRTtZQUNOLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsSUFBSTtZQUNmLFlBQVksRUFBRSxFQUFFO1NBQ2hCO1FBQ0QsVUFBVSxFQUFFO1lBQ1gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsS0FBSztTQUNoQjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLGdCQUFnQjtRQUMzQixVQUFVLEVBQUUsSUFBSTtLQUNoQixDQUNELENBQUM7SUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDM0MsY0FBYyxDQUFDLElBQUksQ0FDbEI7UUFDQyxvQkFBb0IsRUFBRTtZQUNyQixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLElBQUk7WUFDbkIsU0FBUyxFQUFFLElBQUk7WUFDZixNQUFNLEVBQUUsSUFBSTtTQUNaO1FBQ0QsRUFBRSxFQUFFO1lBQ0gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUM5QixTQUFTLEVBQUUsS0FBSztZQUNoQixNQUFNLEVBQUUsSUFBSTtZQUNaLFVBQVUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsSUFBSTtnQkFDWCxHQUFHLEVBQUUsSUFBSTthQUNUO1NBQ0Q7UUFDRCxLQUFLLEVBQUU7WUFDTixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsSUFBSTtTQUNsQjtRQUNELGtCQUFrQixFQUFFO1lBQ25CLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsS0FBSztZQUNoQixZQUFZLEVBQUUsSUFBSTtTQUNsQjtRQUNELHFCQUFxQixFQUFFO1lBQ3RCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsS0FBSztZQUNoQixZQUFZLEVBQUUsSUFBSTtTQUNsQjtRQUNELHlCQUF5QixFQUFFO1lBQzFCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixTQUFTLEVBQUUsS0FBSztZQUNoQixZQUFZLEVBQUUsS0FBSztTQUNuQjtRQUNELHNCQUFzQixFQUFFO1lBQ3ZCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7WUFDM0IsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCx1QkFBdUIsRUFBRTtZQUN4QixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsSUFBSTtTQUNsQjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLGdCQUFnQjtRQUMzQixVQUFVLEVBQUUsSUFBSTtLQUNoQixDQUNELENBQUM7SUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDM0MsY0FBYyxDQUFDLElBQUksQ0FDbEI7UUFDQyxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQzlCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1lBQ1osVUFBVSxFQUFFO2dCQUNYLEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2FBQ1Q7U0FDRDtRQUNELFNBQVMsRUFBRTtZQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsSUFBSTtZQUNmLE1BQU0sRUFBRSxLQUFLO1NBQ2I7UUFDRCxVQUFVLEVBQUU7WUFDWCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLElBQUk7WUFDZixNQUFNLEVBQUUsS0FBSztTQUNiO1FBQ0QsWUFBWSxFQUFFO1lBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxLQUFLO1NBQ2I7UUFDRCxrQkFBa0IsRUFBRTtZQUNuQixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsU0FBUyxFQUFFLElBQUk7WUFDZixNQUFNLEVBQUUsS0FBSztTQUNiO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsS0FBSztZQUNoQixNQUFNLEVBQUUsS0FBSztTQUNiO0tBQ0QsRUFDRDtRQUNDLFNBQVM7UUFDVCxTQUFTLEVBQUUsZ0JBQWdCO1FBQzNCLFVBQVUsRUFBRSxLQUFLO0tBQ2pCLENBQ0QsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztJQUNqRCxvQkFBb0IsQ0FBQyxJQUFJLENBQ3hCO1FBQ0MsS0FBSyxFQUFFO1lBQ04sSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQzlCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1lBQ1osVUFBVSxFQUFFO2dCQUNYLEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2FBQ1Q7U0FDRDtRQUNELE1BQU0sRUFBRTtZQUNQLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELE1BQU0sRUFBRTtZQUNQLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxDQUNuQixNQUFNLEVBQ04sT0FBTyxFQUNQLFFBQVEsRUFDUixPQUFPLEVBQ1AsU0FBUyxDQUNUO1lBQ0QsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxNQUFNLEVBQUU7WUFDUCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELFNBQVMsRUFBRTtZQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsT0FBTyxFQUFFO1lBQ1IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJO1NBQ2Y7UUFDRCxRQUFRLEVBQUU7WUFDVCxJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsWUFBWSxFQUFFLElBQUk7WUFDbEIsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO1lBQzNCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsS0FBSztTQUNoQjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLHNCQUFzQjtRQUNqQyxVQUFVLEVBQUUsSUFBSTtLQUNoQixDQUNELENBQUM7SUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDM0MsY0FBYyxDQUFDLElBQUksQ0FDbEI7UUFDQyxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQzlCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1lBQ1osVUFBVSxFQUFFO2dCQUNYLEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2FBQ1Q7U0FDRDtRQUNELGdCQUFnQixFQUFFO1lBQ2pCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixZQUFZLEVBQUUsS0FBSztZQUNuQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELFVBQVUsRUFBRTtZQUNYLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDOUIsVUFBVSxFQUFFLElBQUk7WUFDaEIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDWjtRQUNELGNBQWMsRUFBRTtZQUNmLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUM7WUFDNUMsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELFdBQVcsRUFBRTtZQUNaLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7WUFDdkMsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELG1CQUFtQixFQUFFO1lBQ3BCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7WUFDM0IsU0FBUyxFQUFFLElBQUk7U0FDZjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLGdCQUFnQjtRQUMzQixVQUFVLEVBQUUsSUFBSTtLQUNoQixDQUNELENBQUM7SUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDMUMsYUFBYSxDQUFDLElBQUksQ0FDakI7UUFDQyxFQUFFLEVBQUU7WUFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQzlCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1lBQ1osVUFBVSxFQUFFO2dCQUNYLEtBQUssRUFBRSxJQUFJO2dCQUNYLEdBQUcsRUFBRSxJQUFJO2FBQ1Q7U0FDRDtRQUNELE9BQU8sRUFBRTtZQUNSLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixhQUFhLEVBQUUsSUFBSTtZQUNuQixTQUFTLEVBQUUsSUFBSTtZQUNmLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFO2dCQUNULElBQUksRUFBRTtvQkFDTDt3QkFDQyxPQUFPO3dCQUNQLGNBQWM7d0JBQ2QsaUJBQWlCO3dCQUNqQixhQUFhO3dCQUNiLGNBQWM7d0JBQ2QsY0FBYzt3QkFDZCxPQUFPO3FCQUNQO2lCQUNEO2FBQ0Q7U0FDRDtRQUNELGdCQUFnQixFQUFFO1lBQ2pCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsaUJBQWlCLEVBQUU7WUFDbEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztZQUMzQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELHdCQUF3QixFQUFFO1lBQ3pCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7WUFDM0IsU0FBUyxFQUFFLEtBQUs7U0FDaEI7S0FDRCxFQUNEO1FBQ0MsU0FBUztRQUNULFNBQVMsRUFBRSxlQUFlO1FBQzFCLFVBQVUsRUFBRSxJQUFJO0tBQ2hCLENBQ0QsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUMzQyxjQUFjLENBQUMsSUFBSSxDQUNsQjtRQUNDLEVBQUUsRUFBRTtZQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDOUIsVUFBVSxFQUFFLElBQUk7WUFDaEIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsTUFBTSxFQUFFLElBQUk7WUFDWixVQUFVLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsR0FBRyxFQUFFLElBQUk7YUFDVDtTQUNEO1FBQ0QsS0FBSyxFQUFFO1lBQ04sSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsbUJBQW1CLEVBQUU7WUFDcEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLFNBQVMsRUFBRSxJQUFJO1lBQ2YsTUFBTSxFQUFFLElBQUk7U0FDWjtRQUNELFdBQVcsRUFBRTtZQUNaLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELGNBQWMsRUFBRTtZQUNmLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELG1CQUFtQixFQUFFO1lBQ3BCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixZQUFZLEVBQUUsSUFBSTtZQUNsQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELHFCQUFxQixFQUFFO1lBQ3RCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7WUFDM0IsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxzQkFBc0IsRUFBRTtZQUN2QixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsSUFBSTtTQUNsQjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLGdCQUFnQjtRQUMzQixVQUFVLEVBQUUsSUFBSTtLQUNoQixDQUNELENBQUM7SUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDcEMsT0FBTyxDQUFDLElBQUksQ0FDWDtRQUNDLEVBQUUsRUFBRTtZQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDOUIsVUFBVSxFQUFFLElBQUk7WUFDaEIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsTUFBTSxFQUFFLElBQUk7WUFDWixVQUFVLEVBQUU7Z0JBQ1gsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsR0FBRyxFQUFFLElBQUk7YUFDVDtTQUNEO1FBQ0QsWUFBWSxFQUFFO1lBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsV0FBVyxFQUFFO1lBQ1osSUFBSSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUN2QyxZQUFZLEVBQUUsSUFBSTtZQUNsQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0QsaUJBQWlCLEVBQUU7WUFDbEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsaUJBQWlCLEVBQUU7WUFDbEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QscUJBQXFCLEVBQUU7WUFDdEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO1lBQ3ZCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFNBQVMsRUFBRSxLQUFLO1NBQ2hCO1FBQ0QsZUFBZSxFQUFFO1lBQ2hCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixZQUFZLEVBQUUsS0FBSztZQUNuQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELGdCQUFnQixFQUFFO1lBQ2pCLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixZQUFZLEVBQUUsS0FBSztZQUNuQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELFVBQVUsRUFBRTtZQUNYLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixZQUFZLEVBQUUsSUFBSTtZQUNsQixTQUFTLEVBQUUsSUFBSTtZQUNmLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxpQkFBaUIsRUFBRTtZQUNsQixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsWUFBWSxFQUFFLElBQUk7WUFDbEIsU0FBUyxFQUFFLElBQUk7WUFDZixNQUFNLEVBQUUsSUFBSTtTQUNaO1FBQ0Qsa0JBQWtCLEVBQUU7WUFDbkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsTUFBTSxFQUFFLElBQUk7U0FDWjtRQUNELGlCQUFpQixFQUFFO1lBQ2xCLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixZQUFZLEVBQUUsSUFBSTtZQUNsQixTQUFTLEVBQUUsSUFBSTtZQUNmLE1BQU0sRUFBRSxJQUFJO1NBQ1o7UUFDRCxjQUFjLEVBQUU7WUFDZixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsWUFBWSxFQUFFLElBQUk7WUFDbEIsU0FBUyxFQUFFLElBQUk7U0FDZjtRQUNELFlBQVksRUFBRTtZQUNiLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixZQUFZLEVBQUUsSUFBSTtZQUNsQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0Qsc0JBQXNCLEVBQUU7WUFDdkIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxJQUFJO1NBQ2Y7UUFDRCxtQkFBbUIsRUFBRTtZQUNwQixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07WUFDdEIsWUFBWSxFQUFFLElBQUk7WUFDbEIsU0FBUyxFQUFFLElBQUk7WUFDZixNQUFNLEVBQUUsSUFBSTtTQUNaO1FBQ0QsZ0JBQWdCLEVBQUU7WUFDakIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsTUFBTSxFQUFFLElBQUk7U0FDWjtRQUNELGNBQWMsRUFBRTtZQUNmLElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixZQUFZLEVBQUUsSUFBSTtZQUNsQixTQUFTLEVBQUUsSUFBSTtTQUNmO1FBQ0Qsd0JBQXdCLEVBQUU7WUFDekIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO1lBQ3RCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxJQUFJO1NBQ2Y7S0FDRCxFQUNEO1FBQ0MsU0FBUyxFQUFFLG9CQUFvQixFQUFFO1FBQ2pDLFNBQVMsRUFBRSxTQUFTO1FBQ3BCLFVBQVUsRUFBRSxJQUFJO0tBQ2hCLENBQ0QsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUN4QyxXQUFXLENBQUMsSUFBSSxDQUNmO1FBQ0MsRUFBRSxFQUFFO1lBQ0gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO1lBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUM5QixVQUFVLEVBQUUsSUFBSTtZQUNoQixTQUFTLEVBQUUsS0FBSztZQUNoQixNQUFNLEVBQUUsSUFBSTtZQUNaLFVBQVUsRUFBRTtnQkFDWCxLQUFLLEVBQUUsSUFBSTtnQkFDWCxHQUFHLEVBQUUsSUFBSTthQUNUO1NBQ0Q7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87WUFDdkIsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLElBQUk7WUFDbkIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDWjtRQUNELE1BQU0sRUFBRTtZQUNQLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELFNBQVMsRUFBRTtZQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELFNBQVMsRUFBRTtZQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtZQUN0QixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELFNBQVMsRUFBRTtZQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7WUFDM0IsU0FBUyxFQUFFLEtBQUs7U0FDaEI7UUFDRCxTQUFTLEVBQUU7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsSUFBSTtTQUNsQjtRQUNELFNBQVMsRUFBRTtZQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtZQUNwQixTQUFTLEVBQUUsS0FBSztTQUNoQjtRQUNELFFBQVEsRUFBRTtZQUNULElBQUksRUFBRSxTQUFTLENBQUMsT0FBTztZQUN2QixZQUFZLEVBQUUsSUFBSTtTQUNsQjtLQUNELEVBQ0Q7UUFDQyxTQUFTO1FBQ1QsU0FBUyxFQUFFLGFBQWE7UUFDeEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsS0FBSyxFQUFFO1lBQ04sWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ3pCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQzFCLE9BQU8sQ0FBQyxTQUFrQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQ2xELENBQUMsQ0FBQyxpRUFBaUU7WUFDckUsQ0FBQztZQUNELFlBQVksRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUN6QixPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyw2Q0FBNkM7WUFDOUUsQ0FBQztTQUNEO0tBQ0QsQ0FDRCxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhcmdvbjIgZnJvbSAnYXJnb24yJztcbmltcG9ydCB7IGdldFNlcXVlbGl6ZUluc3RhbmNlIH0gZnJvbSAnLi4vY29uZmlnL2RiJztcbmltcG9ydCB7IERhdGFUeXBlcyB9IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgQXVkaXRMb2cgZnJvbSAnLi9BdWRpdExvZyc7XG5pbXBvcnQgRGF0YVNoYXJlT3B0aW9ucyBmcm9tICcuL0RhdGFTaGFyZU9wdGlvbnMnO1xuaW1wb3J0IERldmljZSBmcm9tICcuL0RldmljZSc7XG5pbXBvcnQgRmFpbGVkTG9naW5BdHRlbXB0cyBmcm9tICcuL0ZhaWxlZExvZ2luQXR0ZW1wdHMnO1xuaW1wb3J0IEZlYXR1cmVSZXF1ZXN0IGZyb20gJy4vRmVhdHVyZVJlcXVlc3QnO1xuaW1wb3J0IEZlZWRiYWNrU3VydmV5IGZyb20gJy4vRmVlZGJhY2tTdXJ2ZXknO1xuaW1wb3J0IEd1ZXN0Ym9va0VudHJ5IGZyb20gJy4vR3Vlc3Rib29rRW50cnknO1xuaW1wb3J0IE11bHRpRmFjdG9yQXV0aFNldHVwIGZyb20gJy4vTXVsdGlGYWN0b3JBdXRoU2V0dXAnO1xuaW1wb3J0IFJlY292ZXJ5TWV0aG9kIGZyb20gJy4vUmVjb3ZlcnlNZXRob2QnO1xuaW1wb3J0IFNlY3VyaXR5RXZlbnQgZnJvbSAnLi9TZWN1cml0eUV2ZW50JztcbmltcG9ydCBTdXBwb3J0UmVxdWVzdCBmcm9tICcuL1N1cHBvcnRSZXF1ZXN0JztcbmltcG9ydCBVc2VyIGZyb20gJy4vVXNlcic7XG5pbXBvcnQgVXNlck1mYSBmcm9tICcuL1VzZXJNZmEnO1xuaW1wb3J0IFVzZXJTZXNzaW9uIGZyb20gJy4vVXNlclNlc3Npb24nO1xuaW1wb3J0IGdldFNlY3JldHMgZnJvbSAnLi4vY29uZmlnL3NlY3JldHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZU1vZGVscygpOiB2b2lkIHtcblx0bGV0IHNlcXVlbGl6ZSA9IGdldFNlcXVlbGl6ZUluc3RhbmNlKCk7XG5cdC8vIGNvbnNvbGUubG9nKCdTZXF1ZWxpemUgaW5zdGFuY2U6ICcsIHNlcXVlbGl6ZSk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBVc2VyJyk7XG5cdFVzZXIuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR1c2VyaWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJuYW1lOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHBhc3N3b3JkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRlbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc0FjY291bnRWZXJpZmllZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHJlc2V0UGFzc3dvcmRUb2tlbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGwsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHJlc2V0UGFzc3dvcmRFeHBpcmVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGwsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlzTWZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGNyZWF0aW9uRGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdVc2VyJyxcblx0XHRcdHRpbWVzdGFtcHM6IGZhbHNlLFxuXHRcdFx0aG9va3M6IHtcblx0XHRcdFx0YmVmb3JlQ3JlYXRlOiBhc3luYyAodXNlcjogVXNlcikgPT4ge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRsZXQgc2VjcmV0cyA9IGF3YWl0IGdldFNlY3JldHMoKTtcblx0XHRcdFx0XHRcdHVzZXIucGFzc3dvcmQgPSBhd2FpdCBhcmdvbjIuaGFzaChcblx0XHRcdFx0XHRcdFx0dXNlci5wYXNzd29yZCArIHNlY3JldHMuUEVQUEVSLFxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogYXJnb24yLmFyZ29uMmlkLFxuXHRcdFx0XHRcdFx0XHRcdG1lbW9yeUNvc3Q6IDQ4NjQwLCAvLyA0Ny41IE1pQiBtZW1vcnlcblx0XHRcdFx0XHRcdFx0XHR0aW1lQ29zdDogNCwgLy8gNCBpdGVyYXRpb25zXG5cdFx0XHRcdFx0XHRcdFx0cGFyYWxsZWxpc206IDFcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuXHRcdFx0XHRcdFx0aWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFx0XHRcdCdFcnJvciBoYXNoaW5nIHBhc3N3b3JkOiAnICsgZXJyb3IubWVzc2FnZVxuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFx0XHRcdCdVbmV4cGVjdGVkIGVycm9yIGR1cmluZyBwYXNzd29yZCBoYXNoaW5nLidcblx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8vIHN5bmNocm9uaXplIGlzTWZhRW5hYmxlZCB2YWx1ZSB3aXRoIHRoZSBhc3NvY2lhdGVkIGlkJ3MgdmFsdWUgb24gdGhlIFVzZXJNZmEgdGFibGVcblx0XHRcdFx0YWZ0ZXJVcGRhdGU6IGFzeW5jICh1c2VyOiBVc2VyKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHVzZXIuY2hhbmdlZCgnaXNNZmFFbmFibGVkJykpIHtcblx0XHRcdFx0XHRcdGF3YWl0IFVzZXJNZmEudXBkYXRlKFxuXHRcdFx0XHRcdFx0XHR7IGlzTWZhRW5hYmxlZDogdXNlci5pc01mYUVuYWJsZWQgfSxcblx0XHRcdFx0XHRcdFx0eyB3aGVyZTogeyBpZDogdXNlci5pZCB9IH1cblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgQXVkaXRMb2cnKTtcblx0QXVkaXRMb2cuaW5pdChcblx0XHR7XG5cdFx0XHRhdWRpdElkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGFjdGlvblR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRpc0luOiBbXG5cdFx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRcdCdjcmVhdGUnLFxuXHRcdFx0XHRcdFx0XHQndXBkYXRlJyxcblx0XHRcdFx0XHRcdFx0J2RlbGV0ZScsXG5cdFx0XHRcdFx0XHRcdCdyZWFkJyxcblx0XHRcdFx0XHRcdFx0J2xvZ2luJyxcblx0XHRcdFx0XHRcdFx0J2xvZ291dCcsXG5cdFx0XHRcdFx0XHRcdCdvdGhlcidcblx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHRdXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhY3Rpb25EZXNjcmlwdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YWZmZWN0ZWRSZXNvdXJjZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwcmV2aW91c1ZhbHVlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRuZXdWYWx1ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1c2VyQWdlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGF1ZGl0TG9nRGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YXVkaXRMb2dVcGRhdGVEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGwsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnQXVkaXRMb2cnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIERhdGFTaGFyZU9wdGlvbnMnKTtcblx0RGF0YVNoYXJlT3B0aW9ucy5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dHJhY2tpbmdQaXhlbE9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVVc2FnZU9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHBhZ2VWaWV3c09wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGludGVyYWN0aW9uRGF0YU9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGRldmljZVR5cGVPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRicm93c2VySW5mb09wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdG9wZXJhdGluZ1N5c3RlbU9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHJhbmRvbUFub25TdXJ2ZXlPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRsYXN0VXBkYXRlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0RhdGFTaGFyZU9wdGlvbnMnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIERldmljZScpO1xuXHREZXZpY2UuaW5pdChcblx0XHR7XG5cdFx0XHRkZXZpY2VJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRkZXZpY2VOYW1lOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGRldmljZVR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdGlzSW46IFtbJ2Rlc2t0b3AnLCAnbGFwdG9wJywgJ3RhYmxldCcsICdtb2JpbGUnLCAnb3RoZXInXV1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG9zOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGJyb3dzZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRsYXN0VXNlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc1RydXN0ZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGlvbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGxhc3RVcGRhdGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnRGV2aWNlJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBGYWlsZWRMb2dpbkF0dGVtcHRzJyk7XG5cdEZhaWxlZExvZ2luQXR0ZW1wdHMuaW5pdChcblx0XHR7XG5cdFx0XHRhdHRlbXB0SWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRpcEFkZHJlc3M6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJBZ2VudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YXR0ZW1wdERhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzTG9ja2VkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdGYWlsZWRMb2dpbkF0dGVtcHRzJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBGZWVkYmFja1N1cnZleScpO1xuXHRGZWVkYmFja1N1cnZleS5pbml0KFxuXHRcdHtcblx0XHRcdHN1cnZleUlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkdlbmVyYWxBcHByb3ZhbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMSxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uU2VydmljZVF1YWxpdHk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkVhc2VPZlVzZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMSxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uVXNlclN1cHBvcnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDAsIC8vIGFsbG93cyBmb3IgTi9BXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkhlbHBHdWlkZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDAsIC8vIGFsbG93cyBmb3IgTi9BXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbklzUHJlbWl1bVVzZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uUHJlbWl1bVZhbHVlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAwLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25MaWtlbGlob29kVG9SZWNvbW1lbmQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvblVzZWZ1bEZlYXR1cmVzQW5kQXNwZWN0czoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSlNPTixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IFtdXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25GZWF0dXJlc1RoYXROZWVkSW1wcm92ZW1lbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkpTT04sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBbXVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uT3BlbkVuZGVkTGlrZVRoZU1vc3Q6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiAnJ1xuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uT3BlbkVuZGVkV2hhdENhbldlSW1wcm92ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6ICcnXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vSGVhcmRBYm91dFVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vQWdlR3JvdXA6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA3XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkRlbW9HZW5kZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vUmVnaW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRGVtb0xhbmdQcmVmOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRmluYWxUaG91Z2h0czoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6ICcnXG5cdFx0XHR9LFxuXHRcdFx0aGFzT3B0ZWRJbkZvckZvbGxvd1VwOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRlbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogJydcblx0XHRcdH0sXG5cdFx0XHRzdXJ2ZXlEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0ZlZWRiYWNrU3VydmV5Jyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBGZWF0dXJlUmVxdWVzdCcpO1xuXHRGZWF0dXJlUmVxdWVzdC5pbml0KFxuXHRcdHtcblx0XHRcdGZlYXR1cmVSZXF1ZXN0TnVtYmVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZW1haWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGxcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlUmVxdWVzdFR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbFxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0Q29udGVudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsXG5cdFx0XHR9LFxuXHRcdFx0Y2FuRm9sbG93VXBGZWF0dXJlUmVxdWVzdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0T3BlbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0Q2xvc2VEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnRmVhdHVyZVJlcXVlc3QnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIEd1ZXN0Ym9va0VudHJ5Jyk7XG5cdEd1ZXN0Ym9va0VudHJ5LmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRndWVzdE5hbWU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Z3Vlc3RFbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRndWVzdE1lc3NhZ2U6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRndWVzdE1lc3NhZ2VTdHlsZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkpTT04sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGVudHJ5RGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdHdWVzdGJvb2tFbnRyeScsXG5cdFx0XHR0aW1lc3RhbXBzOiBmYWxzZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIE11bHRpRmFjdG9yQXV0aFNldHVwJyk7XG5cdE11bHRpRmFjdG9yQXV0aFNldHVwLmluaXQoXG5cdFx0e1xuXHRcdFx0bWZhSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dXNlcklkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0bWV0aG9kOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5FTlVNKFxuXHRcdFx0XHRcdCd0b3RwJyxcblx0XHRcdFx0XHQnZW1haWwnLFxuXHRcdFx0XHRcdCd5dWJpY28nLFxuXHRcdFx0XHRcdCdmaWRvMicsXG5cdFx0XHRcdFx0J3Bhc3NrZXknXG5cdFx0XHRcdCksXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzZWNyZXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cHVibGljS2V5OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRjb3VudGVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc0FjdGl2ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y3JlYXRlZEF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1cGRhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnTXVsdGlGYWN0b3JBdXRoU2V0dXAnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIFJlY292ZXJ5TWV0aG9kJyk7XG5cdFJlY292ZXJ5TWV0aG9kLmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRpc1JlY292ZXJ5QWN0aXZlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0cmVjb3ZlcnlJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRyZWNvdmVyeU1ldGhvZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuRU5VTSgnZW1haWwnLCAnYmFja3VwQ29kZXMnKSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0YmFja3VwQ29kZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkFSUkFZKERhdGFUeXBlcy5TVFJJTkcpLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRyZWNvdmVyeUxhc3RVcGRhdGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnUmVjb3ZlcnlNZXRob2QnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIFNlY3VyaXR5RXZlbnQnKTtcblx0U2VjdXJpdHlFdmVudC5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRldmVudFR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRpc0luOiBbXG5cdFx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRcdCdsb2dpbicsXG5cdFx0XHRcdFx0XHRcdCdmYWlsZWQtbG9naW4nLFxuXHRcdFx0XHRcdFx0XHQncGFzc3dvcmQtY2hhbmdlJyxcblx0XHRcdFx0XHRcdFx0JzJmYS1lbmFibGVkJyxcblx0XHRcdFx0XHRcdFx0JzJmYS1kaXNhYmxlZCcsXG5cdFx0XHRcdFx0XHRcdCdhY2NvdW50LWxvY2snLFxuXHRcdFx0XHRcdFx0XHQnb3RoZXInXG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0XVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnREZXNjcmlwdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1c2VyQWdlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHNlY3VyaXR5RXZlbnREYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzZWN1cml0eUV2ZW50TGFzdFVwZGF0ZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnU2VjdXJpdHlFdmVudCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgU3VwcG9ydFJlcXVlc3QnKTtcblx0U3VwcG9ydFJlcXVlc3QuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGVtYWlsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzdXBwb3J0VGlja2V0TnVtYmVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUeXBlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c3VwcG9ydENvbnRlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1N1cHBvcnRUaWNrZXRPcGVuOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzdXBwb3J0VGlja2V0T3BlbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUaWNrZXRDbG9zZURhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdTdXBwb3J0UmVxdWVzdCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgVXNlck1mYScpO1xuXHRVc2VyTWZhLmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRpc01mYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRiYWNrdXBDb2Rlczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQVJSQVkoRGF0YVR5cGVzLlNUUklORyksXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXNFbWFpbDJmYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1RvdHBsMmZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzWXViaWNvT3RwMmZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzVTJmMmZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzUGFzc2tleUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR0b3RwU2VjcmV0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR5dWJpY29PdHBQdWJsaWNJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGwsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0eXViaWNvT3RwU2VjcmV0S2V5OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRmaWRvMkNyZWRlbnRpYWxJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGwsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0ZmlkbzJQdWJsaWNLZXk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0ZmlkbzJDb3VudGVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGwsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGZpZG8yQXR0ZXN0YXRpb25Gb3JtYXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwYXNza2V5Q3JlZGVudGlhbElkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwYXNza2V5UHVibGljS2V5OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGwsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGFzc2tleUNvdW50ZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGFzc2tleUF0dGVzdGF0aW9uRm9ybWF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemU6IGdldFNlcXVlbGl6ZUluc3RhbmNlKCksXG5cdFx0XHRtb2RlbE5hbWU6ICdVc2VyTWZhJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBVc2VyU2Vzc2lvbicpO1xuXHRVc2VyU2Vzc2lvbi5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0c2Vzc2lvbklkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR1c2VySWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpcEFkZHJlc3M6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJBZ2VudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y3JlYXRlZEF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1cGRhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsXG5cdFx0XHR9LFxuXHRcdFx0ZXhwaXJlc0F0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0aXNBY3RpdmU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnVXNlclNlc3Npb24nLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdGhvb2tzOiB7XG5cdFx0XHRcdGJlZm9yZUNyZWF0ZTogKHNlc3Npb24pID0+IHtcblx0XHRcdFx0XHRzZXNzaW9uLmV4cGlyZXNBdCA9IG5ldyBEYXRlKFxuXHRcdFx0XHRcdFx0KHNlc3Npb24uY3JlYXRlZEF0IGFzIERhdGUpLmdldFRpbWUoKSArIDYwICogNjAwMDBcblx0XHRcdFx0XHQpOyAvLyBkZWZhdWx0IGV4cGlyYXRpb24gdGltZSBpcyA2MCBtaW51dGVzIGFmdGVyIHNlc3Npb24gZ2VuZXJhdGlvblxuXHRcdFx0XHR9LFxuXHRcdFx0XHRiZWZvcmVVcGRhdGU6IChzZXNzaW9uKSA9PiB7XG5cdFx0XHRcdFx0c2Vzc2lvbi51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpOyAvLyB1cGRhdGUgdGhlIHVwZGF0ZWRBdCBmaWVsZCBvbiBldmVyeSB1cGRhdGVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0KTtcbn1cbiJdfQ==
