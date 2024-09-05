import { Model, DataTypes } from 'sequelize';
import { User } from './User';
import { validateDependencies } from '../utils/validateDependencies';
import { processError } from '../utils/processError';
class UserMfa extends Model {
	id;
	isMfaEnabled;
	backupCodes;
	isEmail2faEnabled;
	isTotp2faEnabled;
	isYubicoOtp2faEnabled;
	isU2f2faEnabled;
	isPasskeyEnabled;
	totpSecret;
	yubicoOtpPublicId;
	yubicoOtpSecretKey;
	fido2CredentialId;
	fido2PublicKey;
	fido2Counter;
	fido2AttestationFormat;
	passkeyCredentialId;
	passkeyPublicKey;
	passkeyCounter;
	passkeyAttestationFormat;
}
export default function createUserMfaModel(sequelize, logger) {
	try {
		validateDependencies(
			[
				{ name: 'sequelize', instance: sequelize },
				{ name: 'logger', instance: logger }
			],
			logger || console
		);
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
					allowNull: true
				},
				isEmail2faEnabled: {
					type: DataTypes.BOOLEAN,
					defaultValue: false,
					allowNull: false
				},
				isTotp2faEnabled: {
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
					allowNull: true
				},
				yubicoOtpPublicId: {
					type: DataTypes.STRING,
					allowNull: true
				},
				yubicoOtpSecretKey: {
					type: DataTypes.STRING,
					allowNull: true
				},
				fido2CredentialId: {
					type: DataTypes.STRING,
					allowNull: true
				},
				fido2PublicKey: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				fido2Counter: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				fido2AttestationFormat: {
					type: DataTypes.STRING,
					allowNull: true
				},
				passkeyCredentialId: {
					type: DataTypes.STRING,
					allowNull: true
				},
				passkeyPublicKey: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				passkeyCounter: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				passkeyAttestationFormat: {
					type: DataTypes.STRING,
					allowNull: true
				}
			},
			{
				sequelize,
				modelName: 'UserMfa',
				timestamps: true
			}
		);
		return UserMfa;
	} catch (error) {
		processError(error, logger || console);
		throw error;
	}
}
export { UserMfa };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlck1mYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb2RlbHMvVXNlck1mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBR04sS0FBSyxFQUNMLFNBQVMsRUFFVCxNQUFNLFdBQVcsQ0FBQztBQUNuQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBRTlCLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQXdCckQsTUFBTSxPQUNMLFNBQVEsS0FBaUU7SUFHbEUsRUFBRSxDQUFVO0lBQ1osWUFBWSxDQUFXO0lBQ3ZCLFdBQVcsQ0FBbUI7SUFDOUIsaUJBQWlCLENBQVc7SUFDNUIsZ0JBQWdCLENBQVc7SUFDM0IscUJBQXFCLENBQVc7SUFDaEMsZUFBZSxDQUFXO0lBQzFCLGdCQUFnQixDQUFXO0lBQzNCLFVBQVUsQ0FBaUI7SUFDM0IsaUJBQWlCLENBQWlCO0lBQ2xDLGtCQUFrQixDQUFpQjtJQUNuQyxpQkFBaUIsQ0FBaUI7SUFDbEMsY0FBYyxDQUFpQjtJQUMvQixZQUFZLENBQWlCO0lBQzdCLHNCQUFzQixDQUFpQjtJQUN2QyxtQkFBbUIsQ0FBaUI7SUFDcEMsZ0JBQWdCLENBQWlCO0lBQ2pDLGNBQWMsQ0FBaUI7SUFDL0Isd0JBQXdCLENBQWlCO0NBQ2hEO0FBRUQsTUFBTSxDQUFDLE9BQU8sVUFBVSxrQkFBa0IsQ0FDekMsU0FBb0IsRUFDcEIsTUFBYztJQUVkLElBQUksQ0FBQztRQUNKLG9CQUFvQixDQUNuQjtZQUNDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFO1lBQzFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO1NBQ3BDLEVBQ0QsTUFBTSxJQUFJLE9BQU8sQ0FDakIsQ0FBQztRQUVGLE9BQU8s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U0FDaEIsQ0FDRCxDQUFDO1FBRUYsT0FBTyxPQUFPLENBQUM7SUFDaEIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDaEIsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxLQUFLLENBQUM7SUFDYixDQUFDO0FBQ0YsQ0FBQztBQUVELE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsXG5cdE1vZGVsLFxuXHREYXRhVHlwZXMsXG5cdFNlcXVlbGl6ZVxufSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gJy4vVXNlcic7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9jb25maWcvbG9nZ2VyJztcbmltcG9ydCB7IHZhbGlkYXRlRGVwZW5kZW5jaWVzIH0gZnJvbSAnLi4vdXRpbHMvdmFsaWRhdGVEZXBlbmRlbmNpZXMnO1xuaW1wb3J0IHsgcHJvY2Vzc0Vycm9yIH0gZnJvbSAnLi4vdXRpbHMvcHJvY2Vzc0Vycm9yJztcblxuaW50ZXJmYWNlIFVzZXJNZmFBdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZzsgLy8gVVVJRCBmb3IgdGhlIE1GQSByZWNvcmQgYW5kIHByaW1hcnkga2V5IChmcm9tIFVzZXIgbW9kZWwpXG5cdGlzTWZhRW5hYmxlZDogYm9vbGVhbjtcblx0YmFja3VwQ29kZXM/OiBzdHJpbmdbXSB8IG51bGw7XG5cdGlzRW1haWwyZmFFbmFibGVkOiBib29sZWFuO1xuXHRpc1RvdHAyZmFFbmFibGVkOiBib29sZWFuO1xuXHRpc1l1Ymljb090cDJmYUVuYWJsZWQ6IGJvb2xlYW47XG5cdGlzVTJmMmZhRW5hYmxlZDogYm9vbGVhbjtcblx0aXNQYXNza2V5RW5hYmxlZDogYm9vbGVhbjtcblx0dG90cFNlY3JldDogc3RyaW5nIHwgbnVsbDtcblx0eXViaWNvT3RwUHVibGljSWQ6IHN0cmluZyB8IG51bGw7XG5cdHl1Ymljb090cFNlY3JldEtleTogc3RyaW5nIHwgbnVsbDtcblx0ZmlkbzJDcmVkZW50aWFsSWQ6IHN0cmluZyB8IG51bGw7XG5cdGZpZG8yUHVibGljS2V5OiBzdHJpbmcgfCBudWxsO1xuXHRmaWRvMkNvdW50ZXI6IG51bWJlciB8IG51bGw7XG5cdGZpZG8yQXR0ZXN0YXRpb25Gb3JtYXQ6IHN0cmluZyB8IG51bGw7XG5cdHBhc3NrZXlDcmVkZW50aWFsSWQ6IHN0cmluZyB8IG51bGw7XG5cdHBhc3NrZXlQdWJsaWNLZXk6IHN0cmluZyB8IG51bGw7XG5cdHBhc3NrZXlDb3VudGVyOiBudW1iZXIgfCBudWxsO1xuXHRwYXNza2V5QXR0ZXN0YXRpb25Gb3JtYXQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmNsYXNzIFVzZXJNZmFcblx0ZXh0ZW5kcyBNb2RlbDxJbmZlckF0dHJpYnV0ZXM8VXNlck1mYT4sIEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPFVzZXJNZmE+PlxuXHRpbXBsZW1lbnRzIFVzZXJNZmFBdHRyaWJ1dGVzXG57XG5cdHB1YmxpYyBpZCE6IHN0cmluZztcblx0cHVibGljIGlzTWZhRW5hYmxlZCE6IGJvb2xlYW47XG5cdHB1YmxpYyBiYWNrdXBDb2RlcyE6IHN0cmluZ1tdIHwgbnVsbDtcblx0cHVibGljIGlzRW1haWwyZmFFbmFibGVkITogYm9vbGVhbjtcblx0cHVibGljIGlzVG90cDJmYUVuYWJsZWQhOiBib29sZWFuO1xuXHRwdWJsaWMgaXNZdWJpY29PdHAyZmFFbmFibGVkITogYm9vbGVhbjtcblx0cHVibGljIGlzVTJmMmZhRW5hYmxlZCE6IGJvb2xlYW47XG5cdHB1YmxpYyBpc1Bhc3NrZXlFbmFibGVkITogYm9vbGVhbjtcblx0cHVibGljIHRvdHBTZWNyZXQhOiBzdHJpbmcgfCBudWxsO1xuXHRwdWJsaWMgeXViaWNvT3RwUHVibGljSWQhOiBzdHJpbmcgfCBudWxsO1xuXHRwdWJsaWMgeXViaWNvT3RwU2VjcmV0S2V5ITogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljIGZpZG8yQ3JlZGVudGlhbElkITogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljIGZpZG8yUHVibGljS2V5ITogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljIGZpZG8yQ291bnRlciE6IG51bWJlciB8IG51bGw7XG5cdHB1YmxpYyBmaWRvMkF0dGVzdGF0aW9uRm9ybWF0ITogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljIHBhc3NrZXlDcmVkZW50aWFsSWQhOiBzdHJpbmcgfCBudWxsO1xuXHRwdWJsaWMgcGFzc2tleVB1YmxpY0tleSE6IHN0cmluZyB8IG51bGw7XG5cdHB1YmxpYyBwYXNza2V5Q291bnRlciE6IG51bWJlciB8IG51bGw7XG5cdHB1YmxpYyBwYXNza2V5QXR0ZXN0YXRpb25Gb3JtYXQhOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVVc2VyTWZhTW9kZWwoXG5cdHNlcXVlbGl6ZTogU2VxdWVsaXplLFxuXHRsb2dnZXI6IExvZ2dlclxuKTogdHlwZW9mIFVzZXJNZmEge1xuXHR0cnkge1xuXHRcdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFx0W1xuXHRcdFx0XHR7IG5hbWU6ICdzZXF1ZWxpemUnLCBpbnN0YW5jZTogc2VxdWVsaXplIH0sXG5cdFx0XHRcdHsgbmFtZTogJ2xvZ2dlcicsIGluc3RhbmNlOiBsb2dnZXIgfVxuXHRcdFx0XSxcblx0XHRcdGxvZ2dlciB8fCBjb25zb2xlXG5cdFx0KTtcblxuXHRcdFVzZXJNZmEuaW5pdChcblx0XHRcdHtcblx0XHRcdFx0aWQ6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0XHRyZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0XHRtb2RlbDogVXNlcixcblx0XHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0aXNNZmFFbmFibGVkOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGJhY2t1cENvZGVzOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkFSUkFZKERhdGFUeXBlcy5TVFJJTkcpLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRpc0VtYWlsMmZhRW5hYmxlZDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRpc1RvdHAyZmFFbmFibGVkOiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBmYWxzZSxcblx0XHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGlzWXViaWNvT3RwMmZhRW5hYmxlZDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRpc1UyZjJmYUVuYWJsZWQ6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0aXNQYXNza2V5RW5hYmxlZDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0b3RwU2VjcmV0OiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0eXViaWNvT3RwUHVibGljSWQ6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR5dWJpY29PdHBTZWNyZXRLZXk6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmaWRvMkNyZWRlbnRpYWxJZDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZpZG8yUHVibGljS2V5OiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZpZG8yQ291bnRlcjoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmaWRvMkF0dGVzdGF0aW9uRm9ybWF0OiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0cGFzc2tleUNyZWRlbnRpYWxJZDoge1xuXHRcdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHBhc3NrZXlQdWJsaWNLZXk6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0cGFzc2tleUNvdW50ZXI6IHtcblx0XHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0cGFzc2tleUF0dGVzdGF0aW9uRm9ybWF0OiB7XG5cdFx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0XHRtb2RlbE5hbWU6ICdVc2VyTWZhJyxcblx0XHRcdFx0dGltZXN0YW1wczogdHJ1ZVxuXHRcdFx0fVxuXHRcdCk7XG5cblx0XHRyZXR1cm4gVXNlck1mYTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRwcm9jZXNzRXJyb3IoZXJyb3IsIGxvZ2dlciB8fCBjb25zb2xlKTtcblx0XHR0aHJvdyBlcnJvcjtcblx0fVxufVxuXG5leHBvcnQgeyBVc2VyTWZhIH07XG4iXX0=
