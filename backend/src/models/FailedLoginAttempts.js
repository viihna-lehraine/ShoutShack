import { Model } from 'sequelize';
class FailedLoginAttempts extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'attemptId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'ipAddress', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'userAgent', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'attemptDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isLocked', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
export default FailedLoginAttempts;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmFpbGVkTG9naW5BdHRlbXB0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9GYWlsZWRMb2dpbkF0dGVtcHRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBNEMsS0FBSyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBVzVFLE1BQU0sbUJBQ0wsU0FBUSxLQUdQO0lBSkY7O1FBT0M7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFZO1FBQ1o7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBbUI7UUFDbkI7Ozs7O1dBQW1CO0lBQ3BCLENBQUM7Q0FBQTtBQUVELGVBQWUsbUJBQW1CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmZlckF0dHJpYnV0ZXMsIEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLCBNb2RlbCB9IGZyb20gJ3NlcXVlbGl6ZSc7XG5cbmludGVyZmFjZSBGYWlsZWRMb2dpbkF0dGVtcHRzQXR0cmlidXRlcyB7XG5cdGF0dGVtcHRJZDogc3RyaW5nO1xuXHRpZDogc3RyaW5nO1xuXHRpcEFkZHJlc3M6IHN0cmluZztcblx0dXNlckFnZW50OiBzdHJpbmc7XG5cdGF0dGVtcHREYXRlOiBEYXRlO1xuXHRpc0xvY2tlZDogYm9vbGVhbjtcbn1cblxuY2xhc3MgRmFpbGVkTG9naW5BdHRlbXB0c1xuXHRleHRlbmRzIE1vZGVsPFxuXHRcdEluZmVyQXR0cmlidXRlczxGYWlsZWRMb2dpbkF0dGVtcHRzPixcblx0XHRJbmZlckNyZWF0aW9uQXR0cmlidXRlczxGYWlsZWRMb2dpbkF0dGVtcHRzPlxuXHQ+XG5cdGltcGxlbWVudHMgRmFpbGVkTG9naW5BdHRlbXB0c0F0dHJpYnV0ZXNcbntcblx0YXR0ZW1wdElkITogc3RyaW5nO1xuXHRpZCE6IHN0cmluZztcblx0aXBBZGRyZXNzITogc3RyaW5nO1xuXHR1c2VyQWdlbnQhOiBzdHJpbmc7XG5cdGF0dGVtcHREYXRlITogRGF0ZTtcblx0aXNMb2NrZWQhOiBib29sZWFuO1xufVxuXG5leHBvcnQgZGVmYXVsdCBGYWlsZWRMb2dpbkF0dGVtcHRzO1xuIl19
