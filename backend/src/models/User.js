import { __awaiter } from 'tslib';
import argon2 from 'argon2';
import { DataTypes, Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import initializeDatabase from '../config/db.js';
import getSecrets from '../config/secrets.js';
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
			let secrets = yield getSecrets();
			return yield argon2.verify(
				this.password,
				password + secrets.PEPPER
			);
		});
	}
	// Static method to validate passwords
	static validatePassword(password) {
		let isValidLength = password.length >= 8 && password.length <= 128;
		let hasUpperCase = /[A-Z]/.test(password);
		let hasLowerCase = /[a-z]/.test(password);
		let hasNumber = /\d/.test(password);
		let hasSpecial = /[^A-Za-z0-9]/.test(password);
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
			let isValidPassword = User.validatePassword(password);
			if (!isValidPassword) {
				throw new Error(
					'Password does not meet the security requirements.'
				);
			}
			let newUser = yield User.create({
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
		let secrets = yield getSecrets();
		let sequelize = yield initializeDatabase();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9Vc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxFQUNOLFNBQVMsRUFHVCxLQUFLLEVBQ0wsTUFBTSxXQUFXLENBQUM7QUFDbkIsT0FBTyxFQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDcEMsT0FBTyxrQkFBa0IsTUFBTSxjQUFjLENBQUM7QUFDOUMsT0FBTyxVQUFVLE1BQU0sbUJBQW1CLENBQUM7QUFlM0MsMkJBQTJCO0FBQzNCLE1BQU0sSUFDTCxTQUFRLEtBQTJEO0lBRHBFOztRQUlDOzs7OztXQUFZO1FBQ1o7Ozs7O1dBQWdCO1FBQ2hCOzs7OztXQUFrQjtRQUNsQjs7Ozs7V0FBa0I7UUFDbEI7Ozs7O1dBQWU7UUFDZjs7Ozs7V0FBNEI7UUFDNUI7Ozs7O1dBQW1DO1FBQ25DOzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBdUI7UUFDdkI7Ozs7O1dBQW9CO0lBb0RyQixDQUFDO0lBbERBLDhCQUE4QjtJQUN4QixlQUFlLENBQUMsUUFBZ0I7O1lBQ3JDLElBQUksT0FBTyxHQUFHLE1BQU0sVUFBVSxFQUFFLENBQUM7WUFDakMsT0FBTyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RFLENBQUM7S0FBQTtJQUVELHNDQUFzQztJQUN0QyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBZ0I7UUFDdkMsSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDbkUsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQyxJQUFJLFlB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LEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsR0FBRztnQkFDM0IsU0FBUyxFQUFFLEtBQUs7YUFDaEI7U0FDRCxFQUNEO1lBQ0MsU0FBUztZQUNULFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLEtBQUssRUFBRTtnQkFDTixZQUFZLEVBQUUsQ0FBTyxJQUFVLEVBQUUsRUFBRTtvQkFDbEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFDOUI7d0JBQ0MsSUFBSSxFQUFFLE1BQU0sQ0FBQyxRQUFRO3dCQUNyQixVQUFVLEVBQUUsS0FBSyxFQUFFLGtCQUFrQjt3QkFDckMsUUFBUSxFQUFFLENBQUMsRUFBRSxlQUFlO3dCQUM1QixXQUFXLEVBQUUsQ0FBQztxQkFDZCxDQUNELENBQUM7Z0JBQ0gsQ0FBQyxDQUFBO2FBQ0Q7U0FDRCxDQUNELENBQUM7UUFFRixNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsQixPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7Q0FBQTtBQUVELE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztBQUMvQyxlQUFlLGdCQUFnQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFyZ29uMiBmcm9tICdhcmdvbjInO1xuaW1wb3J0IHtcblx0RGF0YVR5cGVzLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRNb2RlbFxufSBmcm9tICdzZXF1ZWxpemUnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgZ2V0U2VjcmV0cyBmcm9tICcuLi9jb25maWcvc2VjcmV0cyc7XG5cbmludGVyZmFjZSBVc2VyQXR0cmlidXRlcyB7XG5cdGlkOiBzdHJpbmc7XG5cdHVzZXJpZD86IG51bWJlcjtcblx0dXNlcm5hbWU6IHN0cmluZztcblx0cGFzc3dvcmQ6IHN0cmluZztcblx0ZW1haWw6IHN0cmluZztcblx0aXNBY2NvdW50VmVyaWZpZWQ6IGJvb2xlYW47XG5cdHJlc2V0UGFzc3dvcmRUb2tlbj86IHN0cmluZyB8IG51bGw7XG5cdHJlc2V0UGFzc3dvcmRFeHBpcmVzPzogRGF0ZSB8IG51bGw7XG5cdGlzTWZhRW5hYmxlZDogYm9vbGVhbjtcblx0Y3JlYXRpb25EYXRlOiBEYXRlO1xufVxuXG4vLyBGaWVsZHMgaW4gdGhlIFVzZXIgbW9kZWxcbmNsYXNzIFVzZXJcblx0ZXh0ZW5kcyBNb2RlbDxJbmZlckF0dHJpYnV0ZXM8VXNlcj4sIEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPFVzZXI+PlxuXHRpbXBsZW1lbnRzIFVzZXJBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHR1c2VyaWQ/OiBudW1iZXI7XG5cdHVzZXJuYW1lITogc3RyaW5nO1xuXHRwYXNzd29yZCE6IHN0cmluZztcblx0ZW1haWwhOiBzdHJpbmc7XG5cdGlzQWNjb3VudFZlcmlmaWVkITogYm9vbGVhbjtcblx0cmVzZXRQYXNzd29yZFRva2VuITogc3RyaW5nIHwgbnVsbDtcblx0cmVzZXRQYXNzd29yZEV4cGlyZXMhOiBEYXRlIHwgbnVsbDtcblx0aXNNZmFFbmFibGVkITogYm9vbGVhbjtcblx0Y3JlYXRpb25EYXRlITogRGF0ZTtcblxuXHQvLyBNZXRob2QgdG8gY29tcGFyZSBwYXNzd29yZHNcblx0YXN5bmMgY29tcGFyZVBhc3N3b3JkKHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRsZXQgc2VjcmV0cyA9IGF3YWl0IGdldFNlY3JldHMoKTtcblx0XHRyZXR1cm4gYXdhaXQgYXJnb24yLnZlcmlmeSh0aGlzLnBhc3N3b3JkLCBwYXNzd29yZCArIHNlY3JldHMuUEVQUEVSKTtcblx0fVxuXG5cdC8vIFN0YXRpYyBtZXRob2QgdG8gdmFsaWRhdGUgcGFzc3dvcmRzXG5cdHN0YXRpYyB2YWxpZGF0ZVBhc3N3b3JkKHBhc3N3b3JkOiBzdHJpbmcpOiBib29sZWFuIHtcblx0XHRsZXQgaXNWYWxpZExlbmd0aCA9IHBhc3N3b3JkLmxlbmd0aCA+PSA4ICYmIHBhc3N3b3JkLmxlbmd0aCA8PSAxMjg7XG5cdFx0bGV0IGhhc1VwcGVyQ2FzZSA9IC9bQS1aXS8udGVzdChwYXNzd29yZCk7XG5cdFx0bGV0IGhhc0xvd2VyQ2FzZSA9IC9bYS16XS8udGVzdChwYXNzd29yZCk7XG5cdFx0bGV0IGhhc051bWJlciA9IC9cXGQvLnRlc3QocGFzc3dvcmQpO1xuXHRcdGxldCBoYXNTcGVjaWFsID0gL1teQS1aYS16MC05XS8udGVzdChwYXNzd29yZCk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0aXNWYWxpZExlbmd0aCAmJlxuXHRcdFx0aGFzVXBwZXJDYXNlICYmXG5cdFx0XHRoYXNMb3dlckNhc2UgJiZcblx0XHRcdGhhc051bWJlciAmJlxuXHRcdFx0aGFzU3BlY2lhbFxuXHRcdCk7XG5cdH1cblxuXHQvLyBTdGF0aWMgbWV0aG9kIHRvIGNyZWF0ZSBhIG5ldyB1c2VyXG5cdHN0YXRpYyBhc3luYyBjcmVhdGVVc2VyKFxuXHRcdHVzZXJuYW1lOiBzdHJpbmcsXG5cdFx0cGFzc3dvcmQ6IHN0cmluZyxcblx0XHRlbWFpbDogc3RyaW5nXG5cdCk6IFByb21pc2U8VXNlcj4ge1xuXHRcdGxldCBpc1ZhbGlkUGFzc3dvcmQgPSBVc2VyLnZhbGlkYXRlUGFzc3dvcmQocGFzc3dvcmQpO1xuXHRcdGlmICghaXNWYWxpZFBhc3N3b3JkKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdCdQYXNzd29yZCBkb2VzIG5vdCBtZWV0IHRoZSBzZWN1cml0eSByZXF1aXJlbWVudHMuJ1xuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRsZXQgbmV3VXNlciA9IGF3YWl0IFVzZXIuY3JlYXRlKHtcblx0XHRcdGlkOiB1dWlkdjQoKSxcblx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0cGFzc3dvcmQsXG5cdFx0XHRlbWFpbCxcblx0XHRcdGlzQWNjb3VudFZlcmlmaWVkOiBmYWxzZSxcblx0XHRcdHJlc2V0UGFzc3dvcmRUb2tlbjogbnVsbCxcblx0XHRcdHJlc2V0UGFzc3dvcmRFeHBpcmVzOiBudWxsLFxuXHRcdFx0aXNNZmFFbmFibGVkOiBmYWxzZSxcblx0XHRcdGNyZWF0aW9uRGF0ZTogbmV3IERhdGUoKVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG5ld1VzZXI7XG5cdH1cbn1cblxuLy8gSW5pdGlhbGl6ZSB0aGUgVXNlciBtb2RlbFxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZVVzZXJNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBVc2VyPiB7XG5cdGxldCBzZWNyZXRzID0gYXdhaXQgZ2V0U2VjcmV0cygpO1xuXHRsZXQgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cblx0VXNlci5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0dXNlcm5hbWU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGFzc3dvcmQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGVtYWlsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlzQWNjb3VudFZlcmlmaWVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0cmVzZXRQYXNzd29yZFRva2VuOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cmVzZXRQYXNzd29yZEV4cGlyZXM6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogbnVsbCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXNNZmFFbmFibGVkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IGZhbHNlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y3JlYXRpb25EYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ1VzZXInLFxuXHRcdFx0dGltZXN0YW1wczogZmFsc2UsXG5cdFx0XHRob29rczoge1xuXHRcdFx0XHRiZWZvcmVDcmVhdGU6IGFzeW5jICh1c2VyOiBVc2VyKSA9PiB7XG5cdFx0XHRcdFx0dXNlci5wYXNzd29yZCA9IGF3YWl0IGFyZ29uMi5oYXNoKFxuXHRcdFx0XHRcdFx0dXNlci5wYXNzd29yZCArIHNlY3JldHMuUEVQUEVSLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR0eXBlOiBhcmdvbjIuYXJnb24yaWQsXG5cdFx0XHRcdFx0XHRcdG1lbW9yeUNvc3Q6IDQ4NjQwLCAvLyA0Ny41IE1pQiBtZW1vcnlcblx0XHRcdFx0XHRcdFx0dGltZUNvc3Q6IDQsIC8vIDQgaXRlcmF0aW9uc1xuXHRcdFx0XHRcdFx0XHRwYXJhbGxlbGlzbTogMVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdCk7XG5cblx0YXdhaXQgVXNlci5zeW5jKCk7XG5cdHJldHVybiBVc2VyO1xufVxuXG5jb25zdCBVc2VyTW9kZWxQcm9taXNlID0gaW5pdGlhbGl6ZVVzZXJNb2RlbCgpO1xuZXhwb3J0IGRlZmF1bHQgVXNlck1vZGVsUHJvbWlzZTtcbiJdfQ==
