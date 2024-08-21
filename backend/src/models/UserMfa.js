import { Model } from 'sequelize';
// Fields in the UserMfa Model
class UserMfa extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
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
		Object.defineProperty(this, 'backupCodes', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isEmail2faEnabled', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isTotpl2faEnabled', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isYubicoOtp2faEnabled', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isU2f2faEnabled', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isPasskeyEnabled', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'totpSecret', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'yubicoOtpPublicId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'yubicoOtpSecretKey', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'fido2CredentialId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'fido2PublicKey', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'fido2Counter', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'fido2AttestationFormat', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'passkeyCredentialId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'passkeyPublicKey', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'passkeyCounter', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'passkeyAttestationFormat', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
export default UserMfa;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlck1mYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9Vc2VyTWZhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBNEMsS0FBSyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBd0I1RSw4QkFBOEI7QUFDOUIsTUFBTSxPQUNMLFNBQVEsS0FBaUU7SUFEMUU7O1FBSUM7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBdUI7UUFDdkI7Ozs7O1dBQThCO1FBQzlCOzs7OztXQUE0QjtRQUM1Qjs7Ozs7V0FBNEI7UUFDNUI7Ozs7O1dBQWdDO1FBQ2hDOzs7OztXQUEwQjtRQUMxQjs7Ozs7V0FBMkI7UUFDM0I7Ozs7O1dBQTJCO1FBQzNCOzs7OztXQUFrQztRQUNsQzs7Ozs7V0FBbUM7UUFDbkM7Ozs7O1dBQWtDO1FBQ2xDOzs7OztXQUErQjtRQUMvQjs7Ozs7V0FBNkI7UUFDN0I7Ozs7O1dBQXVDO1FBQ3ZDOzs7OztXQUFvQztRQUNwQzs7Ozs7V0FBaUM7UUFDakM7Ozs7O1dBQStCO1FBQy9COzs7OztXQUF5QztJQUMxQyxDQUFDO0NBQUE7QUFFRCxlQUFlLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluZmVyQXR0cmlidXRlcywgSW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsIE1vZGVsIH0gZnJvbSAnc2VxdWVsaXplJztcblxuaW50ZXJmYWNlIFVzZXJNZmFBdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZztcblx0aXNNZmFFbmFibGVkOiBib29sZWFuO1xuXHRiYWNrdXBDb2Rlczogc3RyaW5nW10gfCBudWxsO1xuXHRpc0VtYWlsMmZhRW5hYmxlZDogYm9vbGVhbjtcblx0aXNUb3RwbDJmYUVuYWJsZWQ6IGJvb2xlYW47XG5cdGlzWXViaWNvT3RwMmZhRW5hYmxlZDogYm9vbGVhbjtcblx0aXNVMmYyZmFFbmFibGVkOiBib29sZWFuO1xuXHRpc1Bhc3NrZXlFbmFibGVkOiBib29sZWFuO1xuXHR0b3RwU2VjcmV0OiBzdHJpbmcgfCBudWxsO1xuXHR5dWJpY29PdHBQdWJsaWNJZDogc3RyaW5nIHwgbnVsbDtcblx0eXViaWNvT3RwU2VjcmV0S2V5OiBzdHJpbmcgfCBudWxsO1xuXHRmaWRvMkNyZWRlbnRpYWxJZDogc3RyaW5nIHwgbnVsbDtcblx0ZmlkbzJQdWJsaWNLZXk6IHN0cmluZyB8IG51bGw7XG5cdGZpZG8yQ291bnRlcjogbnVtYmVyIHwgbnVsbDtcblx0ZmlkbzJBdHRlc3RhdGlvbkZvcm1hdDogc3RyaW5nIHwgbnVsbDtcblx0cGFzc2tleUNyZWRlbnRpYWxJZDogc3RyaW5nIHwgbnVsbDtcblx0cGFzc2tleVB1YmxpY0tleTogc3RyaW5nIHwgbnVsbDtcblx0cGFzc2tleUNvdW50ZXI6IG51bWJlciB8IG51bGw7XG5cdHBhc3NrZXlBdHRlc3RhdGlvbkZvcm1hdDogc3RyaW5nIHwgbnVsbDtcbn1cblxuLy8gRmllbGRzIGluIHRoZSBVc2VyTWZhIE1vZGVsXG5jbGFzcyBVc2VyTWZhXG5cdGV4dGVuZHMgTW9kZWw8SW5mZXJBdHRyaWJ1dGVzPFVzZXJNZmE+LCBJbmZlckNyZWF0aW9uQXR0cmlidXRlczxVc2VyTWZhPj5cblx0aW1wbGVtZW50cyBVc2VyTWZhQXR0cmlidXRlc1xue1xuXHRpZCE6IHN0cmluZztcblx0aXNNZmFFbmFibGVkITogYm9vbGVhbjtcblx0YmFja3VwQ29kZXMhOiBzdHJpbmdbXSB8IG51bGw7XG5cdGlzRW1haWwyZmFFbmFibGVkITogYm9vbGVhbjtcblx0aXNUb3RwbDJmYUVuYWJsZWQhOiBib29sZWFuO1xuXHRpc1l1Ymljb090cDJmYUVuYWJsZWQhOiBib29sZWFuO1xuXHRpc1UyZjJmYUVuYWJsZWQhOiBib29sZWFuO1xuXHRpc1Bhc3NrZXlFbmFibGVkITogYm9vbGVhbjtcblx0dG90cFNlY3JldCE6IHN0cmluZyB8IG51bGw7XG5cdHl1Ymljb090cFB1YmxpY0lkITogc3RyaW5nIHwgbnVsbDtcblx0eXViaWNvT3RwU2VjcmV0S2V5ITogc3RyaW5nIHwgbnVsbDtcblx0ZmlkbzJDcmVkZW50aWFsSWQhOiBzdHJpbmcgfCBudWxsO1xuXHRmaWRvMlB1YmxpY0tleSE6IHN0cmluZyB8IG51bGw7XG5cdGZpZG8yQ291bnRlciE6IG51bWJlciB8IG51bGw7XG5cdGZpZG8yQXR0ZXN0YXRpb25Gb3JtYXQhOiBzdHJpbmcgfCBudWxsO1xuXHRwYXNza2V5Q3JlZGVudGlhbElkITogc3RyaW5nIHwgbnVsbDtcblx0cGFzc2tleVB1YmxpY0tleSE6IHN0cmluZyB8IG51bGw7XG5cdHBhc3NrZXlDb3VudGVyITogbnVtYmVyIHwgbnVsbDtcblx0cGFzc2tleUF0dGVzdGF0aW9uRm9ybWF0ITogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgVXNlck1mYTtcbiJdfQ==
