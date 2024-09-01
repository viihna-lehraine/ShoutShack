import { DataTypes } from 'sequelize';
import { execSync } from 'child_process';
import path, { dirname } from 'path';
import argon2 from 'argon2';
import { fileURLToPath } from 'url';
import createUserModel from './User.mjs';
import createAuditLogModel from './AuditLog.mjs';
import createDataShareOptionsModel from './DataShareOptions.mjs';
import createDeviceModel from './Device.mjs';
import createFailedLoginAttemptsModel from './FailedLoginAttempts.mjs';
import createFeatureRequestModel from './FeatureRequest.mjs';
import createFeedbackSurveyModel from './FeedbackSurvey.mjs';
import createGuestbookEntryModel from './GuestbookEntry.mjs';
import createMultiFactorAuthSetupModel from './MultiFactorAuthSetup.mjs';
import createRecoveryMethodModel from './RecoveryMethod.mjs';
import createSecurityEventModel from './SecurityEvent.mjs';
import createSupportRequestModel from './SupportRequest.mjs';
import createUserMfaModel from './UserMfa.mjs';
import createUserSessionModel from './UserSession.mjs';
import getSecrets from '../utils/sops.mjs';
import setupLogger from '../config/logger.mjs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logger = setupLogger();
const getDirectoryPath = () => path.resolve(__dirname, '../..');
export async function initializeModels(sequelize) {
	const secrets = await getSecrets.getSecrets({
		logger,
		execSync,
		getDirectoryPath
	});
	const User = createUserModel(sequelize);
	const AuditLog = createAuditLogModel(sequelize);
	const DataShareOptions = createDataShareOptionsModel(sequelize);
	const Device = createDeviceModel(sequelize);
	const FailedLoginAttempts = createFailedLoginAttemptsModel(sequelize);
	const FeatureRequest = createFeatureRequestModel(sequelize);
	const FeedbackSurvey = createFeedbackSurveyModel(sequelize);
	const GuestbookEntry = createGuestbookEntryModel(sequelize);
	const MultiFactorAuthSetup = createMultiFactorAuthSetupModel(sequelize);
	const RecoveryMethod = createRecoveryMethodModel(sequelize);
	const SecurityEvent = createSecurityEventModel(sequelize);
	const SupportRequest = createSupportRequestModel(sequelize);
	const UserMfa = createUserMfaModel(sequelize);
	const UserSession = createUserSessionModel(sequelize);
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
			sequelize,
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
	return {
		User,
		AuditLog,
		DataShareOptions,
		Device,
		FailedLoginAttempts,
		FeatureRequest,
		FeedbackSurvey,
		GuestbookEntry,
		MultiFactorAuthSetup,
		RecoveryMethod,
		SecurityEvent,
		SupportRequest,
		UserMfa,
		UserSession
	};
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWxzSW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbW9kZWxzL01vZGVsc0luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQWEsTUFBTSxXQUFXLENBQUM7QUFDakQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNyQyxPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUNwQyxPQUFPLGVBQWUsTUFBTSxRQUFRLENBQUM7QUFDckMsT0FBTyxtQkFBbUIsTUFBTSxZQUFZLENBQUM7QUFDN0MsT0FBTywyQkFBMkIsTUFBTSxvQkFBb0IsQ0FBQztBQUM3RCxPQUFPLGlCQUFpQixNQUFNLFVBQVUsQ0FBQztBQUN6QyxPQUFPLDhCQUE4QixNQUFNLHVCQUF1QixDQUFDO0FBQ25FLE9BQU8seUJBQXlCLE1BQU0sa0JBQWtCLENBQUM7QUFDekQsT0FBTyx5QkFBeUIsTUFBTSxrQkFBa0IsQ0FBQztBQUN6RCxPQUFPLHlCQUF5QixNQUFNLGtCQUFrQixDQUFDO0FBQ3pELE9BQU8sK0JBQStCLE1BQU0sd0JBQXdCLENBQUM7QUFDckUsT0FBTyx5QkFBeUIsTUFBTSxrQkFBa0IsQ0FBQztBQUN6RCxPQUFPLHdCQUF3QixNQUFNLGlCQUFpQixDQUFDO0FBQ3ZELE9BQU8seUJBQXlCLE1BQU0sa0JBQWtCLENBQUM7QUFDekQsT0FBTyxrQkFBa0IsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxzQkFBc0IsTUFBTSxlQUFlLENBQUM7QUFDbkQsT0FBTyxVQUFVLE1BQU0sZUFBZSxDQUFDO0FBQ3ZDLE9BQU8sV0FBVyxNQUFNLGtCQUFrQixDQUFDO0FBRTNDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxN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SCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGF0YVR5cGVzLCBTZXF1ZWxpemUgfSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCBwYXRoLCB7IGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCBhcmdvbjIgZnJvbSAnYXJnb24yJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuaW1wb3J0IGNyZWF0ZVVzZXJNb2RlbCBmcm9tICcuL1VzZXInO1xuaW1wb3J0IGNyZWF0ZUF1ZGl0TG9nTW9kZWwgZnJvbSAnLi9BdWRpdExvZyc7XG5pbXBvcnQgY3JlYXRlRGF0YVNoYXJlT3B0aW9uc01vZGVsIGZyb20gJy4vRGF0YVNoYXJlT3B0aW9ucyc7XG5pbXBvcnQgY3JlYXRlRGV2aWNlTW9kZWwgZnJvbSAnLi9EZXZpY2UnO1xuaW1wb3J0IGNyZWF0ZUZhaWxlZExvZ2luQXR0ZW1wdHNNb2RlbCBmcm9tICcuL0ZhaWxlZExvZ2luQXR0ZW1wdHMnO1xuaW1wb3J0IGNyZWF0ZUZlYXR1cmVSZXF1ZXN0TW9kZWwgZnJvbSAnLi9GZWF0dXJlUmVxdWVzdCc7XG5pbXBvcnQgY3JlYXRlRmVlZGJhY2tTdXJ2ZXlNb2RlbCBmcm9tICcuL0ZlZWRiYWNrU3VydmV5JztcbmltcG9ydCBjcmVhdGVHdWVzdGJvb2tFbnRyeU1vZGVsIGZyb20gJy4vR3Vlc3Rib29rRW50cnknO1xuaW1wb3J0IGNyZWF0ZU11bHRpRmFjdG9yQXV0aFNldHVwTW9kZWwgZnJvbSAnLi9NdWx0aUZhY3RvckF1dGhTZXR1cCc7XG5pbXBvcnQgY3JlYXRlUmVjb3ZlcnlNZXRob2RNb2RlbCBmcm9tICcuL1JlY292ZXJ5TWV0aG9kJztcbmltcG9ydCBjcmVhdGVTZWN1cml0eUV2ZW50TW9kZWwgZnJvbSAnLi9TZWN1cml0eUV2ZW50JztcbmltcG9ydCBjcmVhdGVTdXBwb3J0UmVxdWVzdE1vZGVsIGZyb20gJy4vU3VwcG9ydFJlcXVlc3QnO1xuaW1wb3J0IGNyZWF0ZVVzZXJNZmFNb2RlbCBmcm9tICcuL1VzZXJNZmEnO1xuaW1wb3J0IGNyZWF0ZVVzZXJTZXNzaW9uTW9kZWwgZnJvbSAnLi9Vc2VyU2Vzc2lvbic7XG5pbXBvcnQgZ2V0U2VjcmV0cyBmcm9tICcuLi91dGlscy9zb3BzJztcbmltcG9ydCBzZXR1cExvZ2dlciBmcm9tICcuLi9jb25maWcvbG9nZ2VyJztcblxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IGRpcm5hbWUoX19maWxlbmFtZSk7XG5cbmNvbnN0IGxvZ2dlciA9IHNldHVwTG9nZ2VyKCk7XG5jb25zdCBnZXREaXJlY3RvcnlQYXRoID0gKCk6IHN0cmluZyA9PiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4nKTtcblxuaW50ZXJmYWNlIE1vZGVscyB7XG5cdFVzZXI6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVVzZXJNb2RlbD47XG5cdEF1ZGl0TG9nOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVBdWRpdExvZ01vZGVsPjtcblx0RGF0YVNoYXJlT3B0aW9uczogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlRGF0YVNoYXJlT3B0aW9uc01vZGVsPjtcblx0RGV2aWNlOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVEZXZpY2VNb2RlbD47XG5cdEZhaWxlZExvZ2luQXR0ZW1wdHM6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUZhaWxlZExvZ2luQXR0ZW1wdHNNb2RlbD47XG5cdEZlYXR1cmVSZXF1ZXN0OiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVGZWF0dXJlUmVxdWVzdE1vZGVsPjtcblx0RmVlZGJhY2tTdXJ2ZXk6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUZlZWRiYWNrU3VydmV5TW9kZWw+O1xuXHRHdWVzdGJvb2tFbnRyeTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlR3Vlc3Rib29rRW50cnlNb2RlbD47XG5cdE11bHRpRmFjdG9yQXV0aFNldHVwOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVNdWx0aUZhY3RvckF1dGhTZXR1cE1vZGVsPjtcblx0UmVjb3ZlcnlNZXRob2Q6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVJlY292ZXJ5TWV0aG9kTW9kZWw+O1xuXHRTZWN1cml0eUV2ZW50OiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVTZWN1cml0eUV2ZW50TW9kZWw+O1xuXHRTdXBwb3J0UmVxdWVzdDogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlU3VwcG9ydFJlcXVlc3RNb2RlbD47XG5cdFVzZXJNZmE6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVVzZXJNZmFNb2RlbD47XG5cdFVzZXJTZXNzaW9uOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVVc2VyU2Vzc2lvbk1vZGVsPjtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVNb2RlbHMoc2VxdWVsaXplOiBTZXF1ZWxpemUpOiBQcm9taXNlPE1vZGVscz4ge1xuXHRjb25zdCBzZWNyZXRzID0gYXdhaXQgZ2V0U2VjcmV0cy5nZXRTZWNyZXRzKHtcblx0XHRsb2dnZXIsXG5cdFx0ZXhlY1N5bmMsXG5cdFx0Z2V0RGlyZWN0b3J5UGF0aFxuXHR9KTtcblxuXHRjb25zdCBVc2VyID0gY3JlYXRlVXNlck1vZGVsKHNlcXVlbGl6ZSk7XG5cdGNvbnN0IEF1ZGl0TG9nID0gY3JlYXRlQXVkaXRMb2dNb2RlbChzZXF1ZWxpemUpO1xuXHRjb25zdCBEYXRhU2hhcmVPcHRpb25zID0gY3JlYXRlRGF0YVNoYXJlT3B0aW9uc01vZGVsKHNlcXVlbGl6ZSk7XG5cdGNvbnN0IERldmljZSA9IGNyZWF0ZURldmljZU1vZGVsKHNlcXVlbGl6ZSk7XG5cdGNvbnN0IEZhaWxlZExvZ2luQXR0ZW1wdHMgPSBjcmVhdGVGYWlsZWRMb2dpbkF0dGVtcHRzTW9kZWwoc2VxdWVsaXplKTtcblx0Y29uc3QgRmVhdHVyZVJlcXVlc3QgPSBjcmVhdGVGZWF0dXJlUmVxdWVzdE1vZGVsKHNlcXVlbGl6ZSk7XG5cdGNvbnN0IEZlZWRiYWNrU3VydmV5ID0gY3JlYXRlRmVlZGJhY2tTdXJ2ZXlNb2RlbChzZXF1ZWxpemUpO1xuXHRjb25zdCBHdWVzdGJvb2tFbnRyeSA9IGNyZWF0ZUd1ZXN0Ym9va0VudHJ5TW9kZWwoc2VxdWVsaXplKTtcblx0Y29uc3QgTXVsdGlGYWN0b3JBdXRoU2V0dXAgPSBjcmVhdGVNdWx0aUZhY3RvckF1dGhTZXR1cE1vZGVsKHNlcXVlbGl6ZSk7XG5cdGNvbnN0IFJlY292ZXJ5TWV0aG9kID0gY3JlYXRlUmVjb3ZlcnlNZXRob2RNb2RlbChzZXF1ZWxpemUpO1xuXHRjb25zdCBTZWN1cml0eUV2ZW50ID0gY3JlYXRlU2VjdXJpdHlFdmVudE1vZGVsKHNlcXVlbGl6ZSk7XG5cdGNvbnN0IFN1cHBvcnRSZXF1ZXN0ID0gY3JlYXRlU3VwcG9ydFJlcXVlc3RNb2RlbChzZXF1ZWxpemUpO1xuXHRjb25zdCBVc2VyTWZhID0gY3JlYXRlVXNlck1mYU1vZGVsKHNlcXVlbGl6ZSk7XG5cdGNvbnN0IFVzZXJTZXNzaW9uID0gY3JlYXRlVXNlclNlc3Npb25Nb2RlbChzZXF1ZWxpemUpO1xuXG5cdFVzZXIuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR1c2VyaWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJuYW1lOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHBhc3N3b3JkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRlbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc0FjY291bnRWZXJpZmllZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHJlc2V0UGFzc3dvcmRUb2tlbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cmVzZXRQYXNzd29yZEV4cGlyZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc01mYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGlvbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnVXNlcicsXG5cdFx0XHR0aW1lc3RhbXBzOiBmYWxzZSxcblx0XHRcdGhvb2tzOiB7XG5cdFx0XHRcdGJlZm9yZUNyZWF0ZTogYXN5bmMgKHVzZXI6IEluc3RhbmNlVHlwZTx0eXBlb2YgVXNlcj4pID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0dXNlci5wYXNzd29yZCA9IGF3YWl0IGFyZ29uMi5oYXNoKFxuXHRcdFx0XHRcdFx0XHR1c2VyLnBhc3N3b3JkICsgc2VjcmV0cy5QRVBQRVIsXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHR0eXBlOiBhcmdvbjIuYXJnb24yaWQsXG5cdFx0XHRcdFx0XHRcdFx0bWVtb3J5Q29zdDogNDg2NDAsIC8vIDQ3LjUgTWlCIG1lbW9yeVxuXHRcdFx0XHRcdFx0XHRcdHRpbWVDb3N0OiA0LCAvLyA0IGl0ZXJhdGlvbnNcblx0XHRcdFx0XHRcdFx0XHRwYXJhbGxlbGlzbTogMVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG5cdFx0XHRcdFx0XHRpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRcdFx0YEVycm9yIGhhc2hpbmcgcGFzc3dvcmQ6ICR7ZXJyb3IubWVzc2FnZX1gXG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRcdFx0J1VuZXhwZWN0ZWQgZXJyb3IgZHVyaW5nIHBhc3N3b3JkIGhhc2hpbmcuJ1xuXHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0YWZ0ZXJVcGRhdGU6IGFzeW5jICh1c2VyOiBJbnN0YW5jZVR5cGU8dHlwZW9mIFVzZXI+KSA9PiB7XG5cdFx0XHRcdFx0aWYgKHVzZXIuY2hhbmdlZCgnaXNNZmFFbmFibGVkJykpIHtcblx0XHRcdFx0XHRcdGF3YWl0IFVzZXJNZmEudXBkYXRlKFxuXHRcdFx0XHRcdFx0XHR7IGlzTWZhRW5hYmxlZDogdXNlci5pc01mYUVuYWJsZWQgfSxcblx0XHRcdFx0XHRcdFx0eyB3aGVyZTogeyBpZDogdXNlci5pZCB9IH1cblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHQpO1xuXG5cdEF1ZGl0TG9nLmluaXQoXG5cdFx0e1xuXHRcdFx0YXVkaXRJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhY3Rpb25UeXBlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0aXNJbjogW1xuXHRcdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0XHQnY3JlYXRlJyxcblx0XHRcdFx0XHRcdFx0J3VwZGF0ZScsXG5cdFx0XHRcdFx0XHRcdCdkZWxldGUnLFxuXHRcdFx0XHRcdFx0XHQncmVhZCcsXG5cdFx0XHRcdFx0XHRcdCdsb2dpbicsXG5cdFx0XHRcdFx0XHRcdCdsb2dvdXQnLFxuXHRcdFx0XHRcdFx0XHQnb3RoZXInXG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0XVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0YWN0aW9uRGVzY3JpcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGFmZmVjdGVkUmVzb3VyY2U6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cHJldmlvdXNWYWx1ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0bmV3VmFsdWU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlwQWRkcmVzczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dXNlckFnZW50OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRhdWRpdExvZ0RhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGF1ZGl0TG9nVXBkYXRlRGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnQXVkaXRMb2cnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIERhdGFTaGFyZU9wdGlvbnMnKTtcblx0RGF0YVNoYXJlT3B0aW9ucy5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0dHJhY2tpbmdQaXhlbE9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVVc2FnZU9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHBhZ2VWaWV3c09wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGludGVyYWN0aW9uRGF0YU9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGRldmljZVR5cGVPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRicm93c2VySW5mb09wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdG9wZXJhdGluZ1N5c3RlbU9wdGlvbjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHJhbmRvbUFub25TdXJ2ZXlPcHRpb246IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRsYXN0VXBkYXRlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0RhdGFTaGFyZU9wdGlvbnMnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIERldmljZScpO1xuXHREZXZpY2UuaW5pdChcblx0XHR7XG5cdFx0XHRkZXZpY2VJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRkZXZpY2VOYW1lOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGRldmljZVR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdGlzSW46IFtbJ2Rlc2t0b3AnLCAnbGFwdG9wJywgJ3RhYmxldCcsICdtb2JpbGUnLCAnb3RoZXInXV1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG9zOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGJyb3dzZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRsYXN0VXNlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc1RydXN0ZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGlvbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGxhc3RVcGRhdGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnRGV2aWNlJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBGYWlsZWRMb2dpbkF0dGVtcHRzJyk7XG5cdEZhaWxlZExvZ2luQXR0ZW1wdHMuaW5pdChcblx0XHR7XG5cdFx0XHRhdHRlbXB0SWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRpcEFkZHJlc3M6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJBZ2VudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YXR0ZW1wdERhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzTG9ja2VkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdGYWlsZWRMb2dpbkF0dGVtcHRzJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBGZWVkYmFja1N1cnZleScpO1xuXHRGZWVkYmFja1N1cnZleS5pbml0KFxuXHRcdHtcblx0XHRcdHN1cnZleUlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkdlbmVyYWxBcHByb3ZhbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMSxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uU2VydmljZVF1YWxpdHk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkVhc2VPZlVzZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMSxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uVXNlclN1cHBvcnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDAsIC8vIGFsbG93cyBmb3IgTi9BXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkhlbHBHdWlkZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDAsIC8vIGFsbG93cyBmb3IgTi9BXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbklzUHJlbWl1bVVzZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uUHJlbWl1bVZhbHVlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAwLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25MaWtlbGlob29kVG9SZWNvbW1lbmQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvblVzZWZ1bEZlYXR1cmVzQW5kQXNwZWN0czoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSlNPTixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IFtdXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25GZWF0dXJlc1RoYXROZWVkSW1wcm92ZW1lbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkpTT04sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBbXVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uT3BlbkVuZGVkTGlrZVRoZU1vc3Q6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiAnJ1xuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uT3BlbkVuZGVkV2hhdENhbldlSW1wcm92ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6ICcnXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vSGVhcmRBYm91dFVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vQWdlR3JvdXA6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA3XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkRlbW9HZW5kZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vUmVnaW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRGVtb0xhbmdQcmVmOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRmluYWxUaG91Z2h0czoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6ICcnXG5cdFx0XHR9LFxuXHRcdFx0aGFzT3B0ZWRJbkZvckZvbGxvd1VwOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRlbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogJydcblx0XHRcdH0sXG5cdFx0XHRzdXJ2ZXlEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0ZlZWRiYWNrU3VydmV5Jyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBGZWF0dXJlUmVxdWVzdCcpO1xuXHRGZWF0dXJlUmVxdWVzdC5pbml0KFxuXHRcdHtcblx0XHRcdGZlYXR1cmVSZXF1ZXN0TnVtYmVyOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZW1haWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZFxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0VHlwZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWRcblx0XHRcdH0sXG5cdFx0XHRmZWF0dXJlUmVxdWVzdENvbnRlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkXG5cdFx0XHR9LFxuXHRcdFx0Y2FuRm9sbG93VXBGZWF0dXJlUmVxdWVzdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0T3BlbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGZlYXR1cmVSZXF1ZXN0Q2xvc2VEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdGZWF0dXJlUmVxdWVzdCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgR3Vlc3Rib29rRW50cnknKTtcblx0R3Vlc3Rib29rRW50cnkuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGd1ZXN0TmFtZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRndWVzdEVtYWlsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGd1ZXN0TWVzc2FnZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGd1ZXN0TWVzc2FnZVN0eWxlczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSlNPTixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0ZW50cnlEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0d1ZXN0Ym9va0VudHJ5Jyxcblx0XHRcdHRpbWVzdGFtcHM6IGZhbHNlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgTXVsdGlGYWN0b3JBdXRoU2V0dXAnKTtcblx0TXVsdGlGYWN0b3JBdXRoU2V0dXAuaW5pdChcblx0XHR7XG5cdFx0XHRtZmFJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR1c2VySWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRtZXRob2Q6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkVOVU0oXG5cdFx0XHRcdFx0J3RvdHAnLFxuXHRcdFx0XHRcdCdlbWFpbCcsXG5cdFx0XHRcdFx0J3l1YmljbycsXG5cdFx0XHRcdFx0J2ZpZG8yJyxcblx0XHRcdFx0XHQncGFzc2tleSdcblx0XHRcdFx0KSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHNlY3JldDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwdWJsaWNLZXk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGNvdW50ZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlzQWN0aXZlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVwZGF0ZWRBdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdNdWx0aUZhY3RvckF1dGhTZXR1cCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgUmVjb3ZlcnlNZXRob2QnKTtcblx0UmVjb3ZlcnlNZXRob2QuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGlzUmVjb3ZlcnlBY3RpdmU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRyZWNvdmVyeUlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHJlY292ZXJ5TWV0aG9kOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5FTlVNKCdlbWFpbCcsICdiYWNrdXBDb2RlcycpLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRiYWNrdXBDb2Rlczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQVJSQVkoRGF0YVR5cGVzLlNUUklORyksXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHJlY292ZXJ5TGFzdFVwZGF0ZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdSZWNvdmVyeU1ldGhvZCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgU2VjdXJpdHlFdmVudCcpO1xuXHRTZWN1cml0eUV2ZW50LmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlLFxuXHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bW9kZWw6IFVzZXIsXG5cdFx0XHRcdFx0a2V5OiAnaWQnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRldmVudElkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGV2ZW50VHlwZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdGlzSW46IFtcblx0XHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdFx0J2xvZ2luJyxcblx0XHRcdFx0XHRcdFx0J2ZhaWxlZC1sb2dpbicsXG5cdFx0XHRcdFx0XHRcdCdwYXNzd29yZC1jaGFuZ2UnLFxuXHRcdFx0XHRcdFx0XHQnMmZhLWVuYWJsZWQnLFxuXHRcdFx0XHRcdFx0XHQnMmZhLWRpc2FibGVkJyxcblx0XHRcdFx0XHRcdFx0J2FjY291bnQtbG9jaycsXG5cdFx0XHRcdFx0XHRcdCdvdGhlcidcblx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHRdXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRldmVudERlc2NyaXB0aW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpcEFkZHJlc3M6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJBZ2VudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c2VjdXJpdHlFdmVudERhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHNlY3VyaXR5RXZlbnRMYXN0VXBkYXRlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdTZWN1cml0eUV2ZW50Jyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0Y29uc29sZS5sb2coJ0luaXRpYWxpemluZyBTdXBwb3J0UmVxdWVzdCcpO1xuXHRTdXBwb3J0UmVxdWVzdC5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0ZW1haWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUaWNrZXROdW1iZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0c3VwcG9ydFR5cGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRzdXBwb3J0Q29udGVudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzU3VwcG9ydFRpY2tldE9wZW46IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHN1cHBvcnRUaWNrZXRPcGVuRGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c3VwcG9ydFRpY2tldENsb3NlRGF0ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZFxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnU3VwcG9ydFJlcXVlc3QnLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdH1cblx0KTtcblxuXHRjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIFVzZXJNZmEnKTtcblx0VXNlck1mYS5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBVc2VyLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0aXNNZmFFbmFibGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0YmFja3VwQ29kZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkFSUkFZKERhdGFUeXBlcy5TVFJJTkcpLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXNFbWFpbDJmYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc1RvdHBsMmZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzWXViaWNvT3RwMmZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzVTJmMmZhRW5hYmxlZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlzUGFzc2tleUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR0b3RwU2VjcmV0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHl1Ymljb090cFB1YmxpY0lkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHl1Ymljb090cFNlY3JldEtleToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRmaWRvMkNyZWRlbnRpYWxJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHVuZGVmaW5lZCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRmaWRvMlB1YmxpY0tleToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGZpZG8yQ291bnRlcjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGZpZG8yQXR0ZXN0YXRpb25Gb3JtYXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHBhc3NrZXlDcmVkZW50aWFsSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGFzc2tleVB1YmxpY0tleToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGFzc2tleUNvdW50ZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwYXNza2V5QXR0ZXN0YXRpb25Gb3JtYXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB1bmRlZmluZWQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnVXNlck1mYScsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgVXNlclNlc3Npb24nKTtcblx0VXNlclNlc3Npb24uaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHNlc3Npb25JZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0dXNlcklkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0aXBBZGRyZXNzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1c2VyQWdlbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGNyZWF0ZWRBdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dXBkYXRlZEF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdW5kZWZpbmVkXG5cdFx0XHR9LFxuXHRcdFx0ZXhwaXJlc0F0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0aXNBY3RpdmU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnVXNlclNlc3Npb24nLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdGhvb2tzOiB7XG5cdFx0XHRcdGJlZm9yZUNyZWF0ZTogc2Vzc2lvbiA9PiB7XG5cdFx0XHRcdFx0c2Vzc2lvbi5leHBpcmVzQXQgPSBuZXcgRGF0ZShcblx0XHRcdFx0XHRcdChzZXNzaW9uLmNyZWF0ZWRBdCBhcyBEYXRlKS5nZXRUaW1lKCkgKyA2MCAqIDYwMDAwXG5cdFx0XHRcdFx0KTsgLy8gZGVmYXVsdCBleHBpcmF0aW9uIHRpbWUgaXMgNjAgbWludXRlcyBhZnRlciBzZXNzaW9uIGdlbmVyYXRpb25cblx0XHRcdFx0fSxcblx0XHRcdFx0YmVmb3JlVXBkYXRlOiBzZXNzaW9uID0+IHtcblx0XHRcdFx0XHRzZXNzaW9uLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7IC8vIHVwZGF0ZSB0aGUgdXBkYXRlZEF0IGZpZWxkIG9uIGV2ZXJ5IHVwZGF0ZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHQpO1xuXG5cdHJldHVybiB7XG5cdFx0VXNlcixcblx0XHRBdWRpdExvZyxcblx0XHREYXRhU2hhcmVPcHRpb25zLFxuXHRcdERldmljZSxcblx0XHRGYWlsZWRMb2dpbkF0dGVtcHRzLFxuXHRcdEZlYXR1cmVSZXF1ZXN0LFxuXHRcdEZlZWRiYWNrU3VydmV5LFxuXHRcdEd1ZXN0Ym9va0VudHJ5LFxuXHRcdE11bHRpRmFjdG9yQXV0aFNldHVwLFxuXHRcdFJlY292ZXJ5TWV0aG9kLFxuXHRcdFNlY3VyaXR5RXZlbnQsXG5cdFx0U3VwcG9ydFJlcXVlc3QsXG5cdFx0VXNlck1mYSxcblx0XHRVc2VyU2Vzc2lvblxuXHR9O1xufVxuIl19
