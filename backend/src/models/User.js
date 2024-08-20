import { __awaiter } from 'tslib';
import argon2 from 'argon2';
import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import initializeDatabase from '../config/db';
import getSecrets from '../config/secrets';
// Fields in the User model
class User extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'userid', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'username', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'password', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'email', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isAccountVerified', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'resetPasswordToken', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'resetPasswordExpires', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isMfaEnabled', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'creationDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
	// Method to compare passwords
	comparePassword(password) {
		return __awaiter(this, void 0, void 0, function* () {
			const secrets = yield getSecrets();
			return yield argon2.verify(
				this.password,
				password + secrets.PEPPER
			);
		});
	}
	// Static method to validate passwords
	static validatePassword(password) {
		const isValidLength = password.length >= 8 && password.length <= 128;
		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumber = /\d/.test(password);
		const hasSpecial = /[^A-Za-z0-9]/.test(password);
		return (
			isValidLength &&
			hasUpperCase &&
			hasLowerCase &&
			hasNumber &&
			hasSpecial
		);
	}
	// Static method to create a new user
	static createUser(username, password, email) {
		return __awaiter(this, void 0, void 0, function* () {
			const isValidPassword = User.validatePassword(password);
			if (!isValidPassword) {
				throw new Error(
					'Password does not meet the security requirements.'
				);
			}
			const newUser = yield User.create({
				id: uuidv4(),
				username,
				password,
				email,
				isAccountVerified: false,
				resetPasswordToken: null,
				resetPasswordExpires: null,
				isMfaEnabled: false,
				creationDate: new Date()
			});
			return newUser;
		});
	}
}
// Initialize the User model
function initializeUserModel() {
	return __awaiter(this, void 0, void 0, function* () {
		const secrets = yield getSecrets();
		const sequelize = yield initializeDatabase();
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
							user.password = yield argon2.hash(
								user.password + secrets.PEPPER,
								{
									type: argon2.argon2id,
									memoryCost: 48640, // 47.5 MiB memory
									timeCost: 4, // 4 iterations
									parallelism: 1
								}
							);
						})
				}
			}
		);
		yield User.sync();
		return User;
	});
}
const UserModelPromise = initializeUserModel();
export default UserModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9Vc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxFQUNOLFNBQVMsRUFHVCxLQUFLLEVBQ0wsTUFBTSxXQUFXLENBQUM7QUFDbkIsT0FBTyxFQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDcEMsT0FBTyxrQkFBa0IsTUFBTSxjQUFjLENBQUM7QUFDOUMsT0FBTyxVQUFVLE1BQU0sbUJBQW1CLENBQUM7QUFlM0MsMkJBQTJCO0FBQzNCLE1BQU0sSUFDTCxTQUFRLEtBQTJEO0lBRHBFOztRQUlDOzs7OztXQUFZO1FBQ1o7Ozs7O1dBQWdCO1FBQ2hCOzs7OztXQUFrQjtRQUNsQjs7Ozs7V0FBa0I7UUFDbEI7Ozs7O1dBQWU7UUFDZjs7Ozs7V0FBNEI7UUFDNUI7Ozs7O1dBQW1DO1FBQ25DOzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBdUI7UUFDdkI7Ozs7O1dBQW9CO0lBb0RyQixDQUFDO0lBbERBLDhCQUE4QjtJQUN4QixlQUFlLENBQUMsUUFBZ0I7O1lBQ3JDLE1BQU0sT0FBTyxHQUFHLE1BQU0sVUFBVSxFQUFFLENBQUM7WUFDbkMsT0FBTyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RFLENBQUM7S0FBQTtJQUVELHNDQUFzQztJQUN0QyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBZ0I7UUFDdkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDckUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxNQUFNLFlB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LEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztnQkFDM0IsU0FBUyxFQUFFLEtBQUs7YUFDaEI7U0FDRCxFQUNEO1lBQ0MsU0FBUztZQUNULFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLEtBQUssRUFBRTtnQkFDTixZQUFZLEVBQUUsQ0FBTyxJQUFVLEVBQUUsRUFBRTtvQkFDbEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFDOUI7d0JBQ0MsSUFBSSxFQUFFLE1BQU0sQ0FBQyxRQUFRO3dCQUNyQixVQUFVLEVBQUUsS0FBSyxFQUFFLGtCQUFrQjt3QkFDckMsUUFBUSxFQUFFLENBQUMsRUFBRSxlQUFlO3dCQUM1QixXQUFXLEVBQUUsQ0FBQztxQkFDZCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFBO2FBQ0Q7U0FDRCxDQUNELENBQUM7UUFFRixNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsQixPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7Q0FBQTtBQUVELE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztBQUMvQyxlQUFlLGdCQUFnQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFyZ29uMiBmcm9tICdhcmdvbjInO1xuaW1wb3J0IHtcblx0RGF0YVR5cGVzLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRNb2RlbFxufSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgZ2V0U2VjcmV0cyBmcm9tICcuLi9jb25maWcvc2VjcmV0cyc7XG5cbmludGVyZmFjZSBVc2VyQXR0cmlidXRlcyB7XG5cdGlkOiBzdHJpbmc7XG5cdHVzZXJpZD86IG51bWJlcjtcblx0dXNlcm5hbWU6IHN0cmluZztcblx0cGFzc3dvcmQ6IHN0cmluZztcblx0ZW1haWw6IHN0cmluZztcblx0aXNBY2NvdW50VmVyaWZpZWQ6IGJvb2xlYW47XG5cdHJlc2V0UGFzc3dvcmRUb2tlbj86IHN0cmluZyB8IG51bGw7XG5cdHJlc2V0UGFzc3dvcmRFeHBpcmVzPzogRGF0ZSB8IG51bGw7XG5cdGlzTWZhRW5hYmxlZDogYm9vbGVhbjtcblx0Y3JlYXRpb25EYXRlOiBEYXRlO1xufVxuXG4vLyBGaWVsZHMgaW4gdGhlIFVzZXIgbW9kZWxcbmNsYXNzIFVzZXJcblx0ZXh0ZW5kcyBNb2RlbDxJbmZlckF0dHJpYnV0ZXM8VXNlcj4sIEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPFVzZXI+PlxuXHRpbXBsZW1lbnRzIFVzZXJBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHR1c2VyaWQ/OiBudW1iZXI7XG5cdHVzZXJuYW1lITogc3RyaW5nO1xuXHRwYXNzd29yZCE6IHN0cmluZztcblx0ZW1haWwhOiBzdHJpbmc7XG5cdGlzQWNjb3VudFZlcmlmaWVkITogYm9vbGVhbjtcblx0cmVzZXRQYXNzd29yZFRva2VuITogc3RyaW5nIHwgbnVsbDtcblx0cmVzZXRQYXNzd29yZEV4cGlyZXMhOiBEYXRlIHwgbnVsbDtcblx0aXNNZmFFbmFibGVkITogYm9vbGVhbjtcblx0Y3JlYXRpb25EYXRlITogRGF0ZTtcblxuXHQvLyBNZXRob2QgdG8gY29tcGFyZSBwYXNzd29yZHNcblx0YXN5bmMgY29tcGFyZVBhc3N3b3JkKHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCBzZWNyZXRzID0gYXdhaXQgZ2V0U2VjcmV0cygpO1xuXHRcdHJldHVybiBhd2FpdCBhcmdvbjIudmVyaWZ5KHRoaXMucGFzc3dvcmQsIHBhc3N3b3JkICsgc2VjcmV0cy5QRVBQRVIpO1xuXHR9XG5cblx0Ly8gU3RhdGljIG1ldGhvZCB0byB2YWxpZGF0ZSBwYXNzd29yZHNcblx0c3RhdGljIHZhbGlkYXRlUGFzc3dvcmQocGFzc3dvcmQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGlzVmFsaWRMZW5ndGggPSBwYXNzd29yZC5sZW5ndGggPj0gOCAmJiBwYXNzd29yZC5sZW5ndGggPD0gMTI4O1xuXHRcdGNvbnN0IGhhc1VwcGVyQ2FzZSA9IC9bQS1aXS8udGVzdChwYXNzd29yZCk7XG5cdFx0Y29uc3QgaGFzTG93ZXJDYXNlID0gL1thLXpdLy50ZXN0KHBhc3N3b3JkKTtcblx0XHRjb25zdCBoYXNOdW1iZXIgPSAvXFxkLy50ZXN0KHBhc3N3b3JkKTtcblx0XHRjb25zdCBoYXNTcGVjaWFsID0gL1teQS1aYS16MC05XS8udGVzdChwYXNzd29yZCk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0aXNWYWxpZExlbmd0aCAmJlxuXHRcdFx0aGFzVXBwZXJDYXNlICYmXG5cdFx0XHRoYXNMb3dlckNhc2UgJiZcblx0XHRcdGhhc051bWJlciAmJlxuXHRcdFx0aGFzU3BlY2lhbFxuXHRcdCk7XG5cdH1cblxuXHQvLyBTdGF0aWMgbWV0aG9kIHRvIGNyZWF0ZSBhIG5ldyB1c2VyXG5cdHN0YXRpYyBhc3luYyBjcmVhdGVVc2VyKFxuXHRcdHVzZXJuYW1lOiBzdHJpbmcsXG5cdFx0cGFzc3dvcmQ6IHN0cmluZyxcblx0XHRlbWFpbDogc3RyaW5nXG5cdCk6IFByb21pc2U8VXNlcj4ge1xuXHRcdGNvbnN0IGlzVmFsaWRQYXNzd29yZCA9IFVzZXIudmFsaWRhdGVQYXNzd29yZChwYXNzd29yZCk7XG5cdFx0aWYgKCFpc1ZhbGlkUGFzc3dvcmQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0J1Bhc3N3b3JkIGRvZXMgbm90IG1lZXQgdGhlIHNlY3VyaXR5IHJlcXVpcmVtZW50cy4nXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG5ld1VzZXIgPSBhd2FpdCBVc2VyLmNyZWF0ZSh7XG5cdFx0XHRpZDogdXVpZHY0KCksXG5cdFx0XHR1c2VybmFtZSxcblx0XHRcdHBhc3N3b3JkLFxuXHRcdFx0ZW1haWwsXG5cdFx0XHRpc0FjY291bnRWZXJpZmllZDogZmFsc2UsXG5cdFx0XHRyZXNldFBhc3N3b3JkVG9rZW46IG51bGwsXG5cdFx0XHRyZXNldFBhc3N3b3JkRXhwaXJlczogbnVsbCxcblx0XHRcdGlzTWZhRW5hYmxlZDogZmFsc2UsXG5cdFx0XHRjcmVhdGlvbkRhdGU6IG5ldyBEYXRlKClcblx0XHR9KTtcblxuXHRcdHJldHVybiBuZXdVc2VyO1xuXHR9XG59XG5cbi8vIEluaXRpYWxpemUgdGhlIFVzZXIgbW9kZWxcbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVVc2VyTW9kZWwoKTogUHJvbWlzZTx0eXBlb2YgVXNlcj4ge1xuXHRjb25zdCBzZWNyZXRzID0gYXdhaXQgZ2V0U2VjcmV0cygpO1xuXHRjb25zdCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblxuXHRVc2VyLmluaXQoXG5cdFx0e1xuXHRcdFx0aWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0dXNlcmlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR1c2VybmFtZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwYXNzd29yZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0ZW1haWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXNBY2NvdW50VmVyaWZpZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRyZXNldFBhc3N3b3JkVG9rZW46IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRyZXNldFBhc3N3b3JkRXhwaXJlczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpc01mYUVuYWJsZWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGlvbkRhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnVXNlcicsXG5cdFx0XHR0aW1lc3RhbXBzOiBmYWxzZSxcblx0XHRcdGhvb2tzOiB7XG5cdFx0XHRcdGJlZm9yZUNyZWF0ZTogYXN5bmMgKHVzZXI6IFVzZXIpID0+IHtcblx0XHRcdFx0XHR1c2VyLnBhc3N3b3JkID0gYXdhaXQgYXJnb24yLmhhc2goXG5cdFx0XHRcdFx0XHR1c2VyLnBhc3N3b3JkICsgc2VjcmV0cy5QRVBQRVIsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHR5cGU6IGFyZ29uMi5hcmdvbjJpZCxcblx0XHRcdFx0XHRcdFx0bWVtb3J5Q29zdDogNDg2NDAsIC8vIDQ3LjUgTWlCIG1lbW9yeVxuXHRcdFx0XHRcdFx0XHR0aW1lQ29zdDogNCwgLy8gNCBpdGVyYXRpb25zXG5cdFx0XHRcdFx0XHRcdHBhcmFsbGVsaXNtOiAxXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0KTtcblxuXHRhd2FpdCBVc2VyLnN5bmMoKTtcblx0cmV0dXJuIFVzZXI7XG59XG5cbmNvbnN0IFVzZXJNb2RlbFByb21pc2UgPSBpbml0aWFsaXplVXNlck1vZGVsKCk7XG5leHBvcnQgZGVmYXVsdCBVc2VyTW9kZWxQcm9taXNlO1xuIl19
