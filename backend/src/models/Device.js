import { Model } from 'sequelize';
class Device extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'deviceId', {
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
		Object.defineProperty(this, 'deviceName', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'deviceType', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'os', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'browser', {
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
		Object.defineProperty(this, 'lastUsed', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isTrusted', {
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
		Object.defineProperty(this, 'lastUpdated', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
export default Device;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGV2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvbW9kZWxzL0RldmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ04sS0FBSyxFQUlMLE1BQU0sV0FBVyxDQUFDO0FBZ0JuQixNQUFNLE1BQ0wsU0FBUSxLQUErRDtJQUR4RTs7UUFJQzs7Ozs7V0FBa0I7UUFDbEI7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBb0I7UUFDcEI7Ozs7O1dBQW9CO1FBQ3BCOzs7OztXQUFZO1FBQ1o7Ozs7O1dBQXdCO1FBQ3hCOzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBa0M7UUFDbEM7Ozs7O1dBQW9CO1FBQ3BCOzs7OztXQUFzQztRQUN0Qzs7Ozs7V0FBcUM7SUFDdEMsQ0FBQztDQUFBO0FBRUQsZUFBZSxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRNb2RlbCxcblx0SW5mZXJBdHRyaWJ1dGVzLFxuXHRJbmZlckNyZWF0aW9uQXR0cmlidXRlcyxcblx0Q3JlYXRpb25PcHRpb25hbFxufSBmcm9tICdzZXF1ZWxpemUnO1xuXG5pbnRlcmZhY2UgRGV2aWNlQXR0cmlidXRlcyB7XG5cdGRldmljZUlkOiBudW1iZXI7XG5cdGlkOiBzdHJpbmc7XG5cdGRldmljZU5hbWU6IHN0cmluZztcblx0ZGV2aWNlVHlwZTogc3RyaW5nO1xuXHRvczogc3RyaW5nO1xuXHRicm93c2VyPzogc3RyaW5nIHwgbnVsbDtcblx0aXBBZGRyZXNzOiBzdHJpbmc7XG5cdGxhc3RVc2VkOiBEYXRlO1xuXHRpc1RydXN0ZWQ6IGJvb2xlYW47XG5cdGNyZWF0aW9uRGF0ZTogRGF0ZTtcblx0bGFzdFVwZGF0ZWQ6IERhdGU7XG59XG5cbmNsYXNzIERldmljZVxuXHRleHRlbmRzIE1vZGVsPEluZmVyQXR0cmlidXRlczxEZXZpY2U+LCBJbmZlckNyZWF0aW9uQXR0cmlidXRlczxEZXZpY2U+PlxuXHRpbXBsZW1lbnRzIERldmljZUF0dHJpYnV0ZXNcbntcblx0ZGV2aWNlSWQhOiBudW1iZXI7XG5cdGlkITogc3RyaW5nO1xuXHRkZXZpY2VOYW1lITogc3RyaW5nO1xuXHRkZXZpY2VUeXBlITogc3RyaW5nO1xuXHRvcyE6IHN0cmluZztcblx0YnJvd3NlciE6IHN0cmluZyB8IG51bGw7XG5cdGlwQWRkcmVzcyE6IHN0cmluZztcblx0bGFzdFVzZWQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHRpc1RydXN0ZWQhOiBib29sZWFuO1xuXHRjcmVhdGlvbkRhdGUhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHRsYXN0VXBkYXRlZCE6IENyZWF0aW9uT3B0aW9uYWw8RGF0ZT47XG59XG5cbmV4cG9ydCBkZWZhdWx0IERldmljZTtcbiJdfQ==
