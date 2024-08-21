import { __awaiter } from 'tslib';
import argon2 from 'argon2';
import { Model } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import getSecrets from '../config/secrets.js';
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
			return argon2.verify(this.password, password + secrets.PEPPER);
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
export default User;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9Vc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLE1BQU0sTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxFQUE0QyxLQUFLLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDNUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxNQUFNLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDcEMsT0FBTyxVQUFVLE1BQU0sbUJBQW1CLENBQUM7QUFlM0MsTUFBTSxJQUNMLFNBQVEsS0FBMkQ7SUFEcEU7O1FBSUM7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBZ0I7UUFDaEI7Ozs7O1dBQWtCO1FBQ2xCOzs7OztXQUFrQjtRQUNsQjs7Ozs7V0FBZTtRQUNmOzs7OztXQUE0QjtRQUM1Qjs7Ozs7V0FBbUM7UUFDbkM7Ozs7O1dBQW1DO1FBQ25DOzs7OztXQUF1QjtRQUN2Qjs7Ozs7V0FBb0I7SUFvRHJCLENBQUM7SUFsREEsOEJBQThCO0lBQ3hCLGVBQWUsQ0FBQyxRQUFnQjs7WUFDckMsTUFBTSxPQUFPLEdBQUcsTUFBTSxVQUFVLEVBQUUsQ0FBQztZQUNuQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hFLENBQUM7S0FBQTtJQUVELHNDQUFzQztJQUN0QyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBZ0I7UUFDdkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUM7UUFDckUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVqRCxPQUFPLENBQ04sYUFBYTtZQUNiLFlBQVk7WUFDWixZQUFZO1lBQ1osU0FBUztZQUNULFVBQVUsQ0FDVixDQUFDO0lBQ0gsQ0FBQztJQUVELHFDQUFxQztJQUNyQyxNQUFNLENBQU8sVUFBVSxDQUN0QixRQUFnQixFQUNoQixRQUFnQixFQUNoQixLQUFhOztZQUViLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQ2QsbURBQW1ELENBQ25ELENBQUM7WUFDSCxDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUNqQyxFQUFFLEVBQUUsTUFBTSxFQUFFO2dCQUNaLFFBQVE7Z0JBQ1IsUUFBUTtnQkFDUixLQUFLO2dCQUNMLGlCQUFpQixFQUFFLEtBQUs7Z0JBQ3hCLGtCQUFrQixFQUFFLElBQUk7Z0JBQ3hCLG9CQUFvQixFQUFFLElBQUk7Z0JBQzFCLFlBQVksRUFBRSxLQUFLO2dCQUNuQixZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUU7YUFDeEIsQ0FBQyxDQUFDO1lBRUgsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztLQUFBO0NBQ0Q7QUFFRCxlQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhcmdvbjIgZnJvbSAnYXJnb24yJztcbmltcG9ydCB7IEluZmVyQXR0cmlidXRlcywgSW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsIE1vZGVsIH0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuaW1wb3J0IGdldFNlY3JldHMgZnJvbSAnLi4vY29uZmlnL3NlY3JldHMnO1xuXG5pbnRlcmZhY2UgVXNlckF0dHJpYnV0ZXMge1xuXHRpZDogc3RyaW5nO1xuXHR1c2VyaWQ/OiBudW1iZXI7XG5cdHVzZXJuYW1lOiBzdHJpbmc7XG5cdHBhc3N3b3JkOiBzdHJpbmc7XG5cdGVtYWlsOiBzdHJpbmc7XG5cdGlzQWNjb3VudFZlcmlmaWVkOiBib29sZWFuO1xuXHRyZXNldFBhc3N3b3JkVG9rZW4/OiBzdHJpbmcgfCBudWxsO1xuXHRyZXNldFBhc3N3b3JkRXhwaXJlcz86IERhdGUgfCBudWxsO1xuXHRpc01mYUVuYWJsZWQ6IGJvb2xlYW47XG5cdGNyZWF0aW9uRGF0ZTogRGF0ZTtcbn1cblxuY2xhc3MgVXNlclxuXHRleHRlbmRzIE1vZGVsPEluZmVyQXR0cmlidXRlczxVc2VyPiwgSW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXM8VXNlcj4+XG5cdGltcGxlbWVudHMgVXNlckF0dHJpYnV0ZXNcbntcblx0aWQhOiBzdHJpbmc7XG5cdHVzZXJpZD86IG51bWJlcjtcblx0dXNlcm5hbWUhOiBzdHJpbmc7XG5cdHBhc3N3b3JkITogc3RyaW5nO1xuXHRlbWFpbCE6IHN0cmluZztcblx0aXNBY2NvdW50VmVyaWZpZWQhOiBib29sZWFuO1xuXHRyZXNldFBhc3N3b3JkVG9rZW4hOiBzdHJpbmcgfCBudWxsO1xuXHRyZXNldFBhc3N3b3JkRXhwaXJlcyE6IERhdGUgfCBudWxsO1xuXHRpc01mYUVuYWJsZWQhOiBib29sZWFuO1xuXHRjcmVhdGlvbkRhdGUhOiBEYXRlO1xuXG5cdC8vIE1ldGhvZCB0byBjb21wYXJlIHBhc3N3b3Jkc1xuXHRhc3luYyBjb21wYXJlUGFzc3dvcmQocGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHNlY3JldHMgPSBhd2FpdCBnZXRTZWNyZXRzKCk7XG5cdFx0cmV0dXJuIGFyZ29uMi52ZXJpZnkodGhpcy5wYXNzd29yZCwgcGFzc3dvcmQgKyBzZWNyZXRzLlBFUFBFUik7XG5cdH1cblxuXHQvLyBTdGF0aWMgbWV0aG9kIHRvIHZhbGlkYXRlIHBhc3N3b3Jkc1xuXHRzdGF0aWMgdmFsaWRhdGVQYXNzd29yZChwYXNzd29yZDogc3RyaW5nKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgaXNWYWxpZExlbmd0aCA9IHBhc3N3b3JkLmxlbmd0aCA+PSA4ICYmIHBhc3N3b3JkLmxlbmd0aCA8PSAxMjg7XG5cdFx0Y29uc3QgaGFzVXBwZXJDYXNlID0gL1tBLVpdLy50ZXN0KHBhc3N3b3JkKTtcblx0XHRjb25zdCBoYXNMb3dlckNhc2UgPSAvW2Etel0vLnRlc3QocGFzc3dvcmQpO1xuXHRcdGNvbnN0IGhhc051bWJlciA9IC9cXGQvLnRlc3QocGFzc3dvcmQpO1xuXHRcdGNvbnN0IGhhc1NwZWNpYWwgPSAvW15BLVphLXowLTldLy50ZXN0KHBhc3N3b3JkKTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHRpc1ZhbGlkTGVuZ3RoICYmXG5cdFx0XHRoYXNVcHBlckNhc2UgJiZcblx0XHRcdGhhc0xvd2VyQ2FzZSAmJlxuXHRcdFx0aGFzTnVtYmVyICYmXG5cdFx0XHRoYXNTcGVjaWFsXG5cdFx0KTtcblx0fVxuXG5cdC8vIFN0YXRpYyBtZXRob2QgdG8gY3JlYXRlIGEgbmV3IHVzZXJcblx0c3RhdGljIGFzeW5jIGNyZWF0ZVVzZXIoXG5cdFx0dXNlcm5hbWU6IHN0cmluZyxcblx0XHRwYXNzd29yZDogc3RyaW5nLFxuXHRcdGVtYWlsOiBzdHJpbmdcblx0KTogUHJvbWlzZTxVc2VyPiB7XG5cdFx0Y29uc3QgaXNWYWxpZFBhc3N3b3JkID0gVXNlci52YWxpZGF0ZVBhc3N3b3JkKHBhc3N3b3JkKTtcblx0XHRpZiAoIWlzVmFsaWRQYXNzd29yZCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHQnUGFzc3dvcmQgZG9lcyBub3QgbWVldCB0aGUgc2VjdXJpdHkgcmVxdWlyZW1lbnRzLidcblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbmV3VXNlciA9IGF3YWl0IFVzZXIuY3JlYXRlKHtcblx0XHRcdGlkOiB1dWlkdjQoKSxcblx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0cGFzc3dvcmQsXG5cdFx0XHRlbWFpbCxcblx0XHRcdGlzQWNjb3VudFZlcmlmaWVkOiBmYWxzZSxcblx0XHRcdHJlc2V0UGFzc3dvcmRUb2tlbjogbnVsbCxcblx0XHRcdHJlc2V0UGFzc3dvcmRFeHBpcmVzOiBudWxsLFxuXHRcdFx0aXNNZmFFbmFibGVkOiBmYWxzZSxcblx0XHRcdGNyZWF0aW9uRGF0ZTogbmV3IERhdGUoKVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG5ld1VzZXI7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVXNlcjtcbiJdfQ==
