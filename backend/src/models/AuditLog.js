import { Model } from 'sequelize';
class AuditLog extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'auditId', {
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
		Object.defineProperty(this, 'actionType', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'actionDescription', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'affectedResource', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'previousValue', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'newValue', {
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
		Object.defineProperty(this, 'auditLogDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'auditLogUpdateDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
export default AuditLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXVkaXRMb2cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvQXVkaXRMb2cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEtBQUssRUFBNEMsTUFBTSxXQUFXLENBQUM7QUFnQjVFLE1BQU0sUUFDTCxTQUFRLEtBQW1FO0lBRDVFOztRQUlDOzs7OztXQUFpQjtRQUNqQjs7Ozs7V0FBWTtRQUNaOzs7OztXQUFvQjtRQUNwQjs7Ozs7V0FBa0M7UUFDbEM7Ozs7O1dBQWlDO1FBQ2pDOzs7OztXQUE4QjtRQUM5Qjs7Ozs7V0FBeUI7UUFDekI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBb0I7UUFDcEI7Ozs7O1dBQWlDO0lBQ2xDLENBQUM7Q0FBQTtBQUVELGVBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kZWwsIEluZmVyQXR0cmlidXRlcywgSW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMgfSBmcm9tICdzZXF1ZWxpemUnO1xuXG5pbnRlcmZhY2UgQXVkaXRMb2dBdHRyaWJ1dGVzIHtcblx0YXVkaXRJZDogc3RyaW5nO1xuXHRpZDogc3RyaW5nO1xuXHRhY3Rpb25UeXBlOiBzdHJpbmc7XG5cdGFjdGlvbkRlc2NyaXB0aW9uPzogc3RyaW5nIHwgbnVsbDtcblx0YWZmZWN0ZWRSZXNvdXJjZT86IHN0cmluZyB8IG51bGw7XG5cdHByZXZpb3VzVmFsdWU/OiBzdHJpbmcgfCBudWxsO1xuXHRuZXdWYWx1ZT86IHN0cmluZyB8IG51bGw7XG5cdGlwQWRkcmVzczogc3RyaW5nO1xuXHR1c2VyQWdlbnQ6IHN0cmluZztcblx0YXVkaXRMb2dEYXRlOiBEYXRlO1xuXHRhdWRpdExvZ1VwZGF0ZURhdGU/OiBEYXRlIHwgbnVsbDtcbn1cblxuY2xhc3MgQXVkaXRMb2dcblx0ZXh0ZW5kcyBNb2RlbDxJbmZlckF0dHJpYnV0ZXM8QXVkaXRMb2c+LCBJbmZlckNyZWF0aW9uQXR0cmlidXRlczxBdWRpdExvZz4+XG5cdGltcGxlbWVudHMgQXVkaXRMb2dBdHRyaWJ1dGVzXG57XG5cdGF1ZGl0SWQhOiBzdHJpbmc7XG5cdGlkITogc3RyaW5nO1xuXHRhY3Rpb25UeXBlITogc3RyaW5nO1xuXHRhY3Rpb25EZXNjcmlwdGlvbiE6IHN0cmluZyB8IG51bGw7XG5cdGFmZmVjdGVkUmVzb3VyY2UhOiBzdHJpbmcgfCBudWxsO1xuXHRwcmV2aW91c1ZhbHVlITogc3RyaW5nIHwgbnVsbDtcblx0bmV3VmFsdWUhOiBzdHJpbmcgfCBudWxsO1xuXHRpcEFkZHJlc3MhOiBzdHJpbmc7XG5cdHVzZXJBZ2VudCE6IHN0cmluZztcblx0YXVkaXRMb2dEYXRlITogRGF0ZTtcblx0YXVkaXRMb2dVcGRhdGVEYXRlPzogRGF0ZSB8IG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IEF1ZGl0TG9nO1xuIl19
