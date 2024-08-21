import { Model } from 'sequelize';
class MultiFactorAuthSetup extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'mfaId', {
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
		Object.defineProperty(this, 'userId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'method', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'secret', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'publicKey', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'counter', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'isActive', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'createdAt', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'updatedAt', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
export default MultiFactorAuthSetup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVsdGlGYWN0b3JBdXRoU2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvTXVsdGlGYWN0b3JBdXRoU2V0dXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUlOLEtBQUssRUFDTCxNQUFNLFdBQVcsQ0FBQztBQWVuQixNQUFNLG9CQUNMLFNBQVEsS0FHUDtJQUpGOztRQU9DOzs7OztXQUFlO1FBQ2Y7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBZ0I7UUFDaEI7Ozs7O1dBQTJEO1FBQzNEOzs7OztXQUF1QjtRQUN2Qjs7Ozs7V0FBMEI7UUFDMUI7Ozs7O1dBQXdCO1FBQ3hCOzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBbUM7UUFDbkM7Ozs7O1dBQW1DO0lBQ3BDLENBQUM7Q0FBQTtBQUVELGVBQWUsb0JBQW9CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRDcmVhdGlvbk9wdGlvbmFsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRNb2RlbFxufSBmcm9tICdzZXF1ZWxpemUnO1xuXG5pbnRlcmZhY2UgTXVsdGlGYWN0b3JBdXRoU2V0dXBBdHRyaWJ1dGVzIHtcblx0bWZhSWQ6IG51bWJlcjtcblx0aWQ6IHN0cmluZztcblx0dXNlcklkOiBzdHJpbmc7XG5cdG1ldGhvZDogJ3RvdHAnIHwgJ2VtYWlsJyB8ICd5dWJpY28nIHwgJ2ZpZG8yJyB8ICdwYXNza2V5Jztcblx0c2VjcmV0Pzogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljS2V5Pzogc3RyaW5nIHwgbnVsbDtcblx0Y291bnRlcj86IG51bWJlciB8IG51bGw7XG5cdGlzQWN0aXZlOiBib29sZWFuO1xuXHRjcmVhdGVkQXQ6IERhdGU7XG5cdHVwZGF0ZWRBdDogRGF0ZTtcbn1cblxuY2xhc3MgTXVsdGlGYWN0b3JBdXRoU2V0dXBcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8TXVsdGlGYWN0b3JBdXRoU2V0dXA+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPE11bHRpRmFjdG9yQXV0aFNldHVwPlxuXHQ+XG5cdGltcGxlbWVudHMgTXVsdGlGYWN0b3JBdXRoU2V0dXBBdHRyaWJ1dGVzXG57XG5cdG1mYUlkITogbnVtYmVyO1xuXHRpZCE6IHN0cmluZztcblx0dXNlcklkITogc3RyaW5nO1xuXHRtZXRob2QhOiAndG90cCcgfCAnZW1haWwnIHwgJ3l1YmljbycgfCAnZmlkbzInIHwgJ3Bhc3NrZXknO1xuXHRzZWNyZXQhOiBzdHJpbmcgfCBudWxsO1xuXHRwdWJsaWNLZXkhOiBzdHJpbmcgfCBudWxsO1xuXHRjb3VudGVyITogbnVtYmVyIHwgbnVsbDtcblx0aXNBY3RpdmUhOiBib29sZWFuO1xuXHRjcmVhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHR1cGRhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBNdWx0aUZhY3RvckF1dGhTZXR1cDtcbiJdfQ==
