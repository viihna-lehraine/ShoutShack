import { Model } from 'sequelize';
class DataShareOptions extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'trackingPixelOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'featureUsageOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'pageViewsOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'interactionDataOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'deviceTypeOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'browserInfoOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'operatingSystemOption', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'randomAnonSurveyOption', {
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
export default DataShareOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YVNoYXJlT3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3RzL21vZGVscy9EYXRhU2hhcmVPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTixLQUFLLEVBSUwsTUFBTSxXQUFXLENBQUM7QUFlbkIsTUFBTSxnQkFDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUE4QjtRQUM5Qjs7Ozs7V0FBNkI7UUFDN0I7Ozs7O1dBQTBCO1FBQzFCOzs7OztXQUFnQztRQUNoQzs7Ozs7V0FBMkI7UUFDM0I7Ozs7O1dBQTRCO1FBQzVCOzs7OztXQUFnQztRQUNoQzs7Ozs7V0FBaUM7UUFDakM7Ozs7O1dBQXFDO0lBQ3RDLENBQUM7Q0FBQTtBQUVELGVBQWUsZ0JBQWdCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHRNb2RlbCxcblx0SW5mZXJBdHRyaWJ1dGVzLFxuXHRJbmZlckNyZWF0aW9uQXR0cmlidXRlcyxcblx0Q3JlYXRpb25PcHRpb25hbFxufSBmcm9tICdzZXF1ZWxpemUnO1xuXG5pbnRlcmZhY2UgRGF0YVNoYXJlT3B0aW9uc0F0dHJpYnV0ZXMge1xuXHRpZDogc3RyaW5nO1xuXHR0cmFja2luZ1BpeGVsT3B0aW9uOiBib29sZWFuO1xuXHRmZWF0dXJlVXNhZ2VPcHRpb246IGJvb2xlYW47XG5cdHBhZ2VWaWV3c09wdGlvbjogYm9vbGVhbjtcblx0aW50ZXJhY3Rpb25EYXRhT3B0aW9uOiBib29sZWFuO1xuXHRkZXZpY2VUeXBlT3B0aW9uOiBib29sZWFuO1xuXHRicm93c2VySW5mb09wdGlvbjogYm9vbGVhbjtcblx0b3BlcmF0aW5nU3lzdGVtT3B0aW9uOiBib29sZWFuO1xuXHRyYW5kb21Bbm9uU3VydmV5T3B0aW9uOiBib29sZWFuO1xuXHRsYXN0VXBkYXRlZDogRGF0ZTtcbn1cblxuY2xhc3MgRGF0YVNoYXJlT3B0aW9uc1xuXHRleHRlbmRzIE1vZGVsPFxuXHRcdEluZmVyQXR0cmlidXRlczxEYXRhU2hhcmVPcHRpb25zPixcblx0XHRJbmZlckNyZWF0aW9uQXR0cmlidXRlczxEYXRhU2hhcmVPcHRpb25zPlxuXHQ+XG5cdGltcGxlbWVudHMgRGF0YVNoYXJlT3B0aW9uc0F0dHJpYnV0ZXNcbntcblx0aWQhOiBzdHJpbmc7XG5cdHRyYWNraW5nUGl4ZWxPcHRpb24hOiBib29sZWFuO1xuXHRmZWF0dXJlVXNhZ2VPcHRpb24hOiBib29sZWFuO1xuXHRwYWdlVmlld3NPcHRpb24hOiBib29sZWFuO1xuXHRpbnRlcmFjdGlvbkRhdGFPcHRpb24hOiBib29sZWFuO1xuXHRkZXZpY2VUeXBlT3B0aW9uITogYm9vbGVhbjtcblx0YnJvd3NlckluZm9PcHRpb24hOiBib29sZWFuO1xuXHRvcGVyYXRpbmdTeXN0ZW1PcHRpb24hOiBib29sZWFuO1xuXHRyYW5kb21Bbm9uU3VydmV5T3B0aW9uITogYm9vbGVhbjtcblx0bGFzdFVwZGF0ZWQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5leHBvcnQgZGVmYXVsdCBEYXRhU2hhcmVPcHRpb25zO1xuIl19
