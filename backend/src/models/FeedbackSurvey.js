import { Model } from 'sequelize';
class FeedbackSurvey extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'surveyId', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionGeneralApproval', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionServiceQuality', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionEaseOfUse', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionUserSupport', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionHelpGuides', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionIsPremiumUser', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionPremiumValue', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionLikelihoodToRecommend', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionUsefulFeaturesAndAspects', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionFeaturesThatNeedImprovement', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionOpenEndedLikeTheMost', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionOpenEndedWhatCanWeImprove', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionDemoHeardAboutUs', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionDemoAgeGroup', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionDemoGender', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionDemoRegion', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionDemoLangPref', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'questionFinalThoughts', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'hasOptedInForFollowUp', {
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
		Object.defineProperty(this, 'surveyDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
export default FeedbackSurvey;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmVlZGJhY2tTdXJ2ZXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvRmVlZGJhY2tTdXJ2ZXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUE0QyxLQUFLLEVBQUUsTUFBTSxXQUFXLENBQUM7QUEyQjVFLE1BQU0sY0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBa0I7UUFDbEI7Ozs7O1dBQXdDO1FBQ3hDOzs7OztXQUF1QztRQUN2Qzs7Ozs7V0FBa0M7UUFDbEM7Ozs7O1dBQW9DO1FBQ3BDOzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBdUM7UUFDdkM7Ozs7O1dBQXFDO1FBQ3JDOzs7OztXQUE4QztRQUM5Qzs7Ozs7V0FBaUQ7UUFDakQ7Ozs7O1dBQW9EO1FBQ3BEOzs7OztXQUE2QztRQUM3Qzs7Ozs7V0FBa0Q7UUFDbEQ7Ozs7O1dBQXlDO1FBQ3pDOzs7OztXQUFxQztRQUNyQzs7Ozs7V0FBbUM7UUFDbkM7Ozs7O1dBQW1DO1FBQ25DOzs7OztXQUFxQztRQUNyQzs7Ozs7V0FBc0M7UUFDdEM7Ozs7O1dBQXVDO1FBQ3ZDOzs7OztXQUFzQjtRQUN0Qjs7Ozs7V0FBa0I7SUFDbkIsQ0FBQztDQUFBO0FBRUQsZUFBZSxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmZlckF0dHJpYnV0ZXMsIEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLCBNb2RlbCB9IGZyb20gJ3NlcXVlbGl6ZSc7XG5cbmludGVyZmFjZSBGZWVkYmFja1N1cnZleUF0dHJpYnV0ZXMge1xuXHRzdXJ2ZXlJZDogc3RyaW5nO1xuXHRxdWVzdGlvbkdlbmVyYWxBcHByb3ZhbD86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uU2VydmljZVF1YWxpdHk/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkVhc2VPZlVzZT86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uVXNlclN1cHBvcnQ/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkhlbHBHdWlkZXM/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbklzUHJlbWl1bVVzZXI/OiBib29sZWFuIHwgbnVsbDtcblx0cXVlc3Rpb25QcmVtaXVtVmFsdWU/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkxpa2VsaWhvb2RUb1JlY29tbWVuZD86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uVXNlZnVsRmVhdHVyZXNBbmRBc3BlY3RzPzogb2JqZWN0IHwgbnVsbDtcblx0cXVlc3Rpb25GZWF0dXJlc1RoYXROZWVkSW1wcm92ZW1lbnQ/OiBvYmplY3QgfCBudWxsO1xuXHRxdWVzdGlvbk9wZW5FbmRlZExpa2VUaGVNb3N0Pzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25PcGVuRW5kZWRXaGF0Q2FuV2VJbXByb3ZlPzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vSGVhcmRBYm91dFVzPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vQWdlR3JvdXA/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkRlbW9HZW5kZXI/OiBzdHJpbmcgfCBudWxsO1xuXHRxdWVzdGlvbkRlbW9SZWdpb24/OiBzdHJpbmcgfCBudWxsO1xuXHRxdWVzdGlvbkRlbW9MYW5nUHJlZj86IHN0cmluZyB8IG51bGw7XG5cdHF1ZXN0aW9uRmluYWxUaG91Z2h0cz86IHN0cmluZyB8IG51bGw7XG5cdGhhc09wdGVkSW5Gb3JGb2xsb3dVcD86IGJvb2xlYW4gfCBudWxsO1xuXHRlbWFpbD86IHN0cmluZyB8IG51bGw7XG5cdHN1cnZleURhdGU6IERhdGU7XG59XG5cbmNsYXNzIEZlZWRiYWNrU3VydmV5XG5cdGV4dGVuZHMgTW9kZWw8XG5cdFx0SW5mZXJBdHRyaWJ1dGVzPEZlZWRiYWNrU3VydmV5Pixcblx0XHRJbmZlckNyZWF0aW9uQXR0cmlidXRlczxGZWVkYmFja1N1cnZleT5cblx0PlxuXHRpbXBsZW1lbnRzIEZlZWRiYWNrU3VydmV5QXR0cmlidXRlc1xue1xuXHRzdXJ2ZXlJZCE6IHN0cmluZztcblx0cXVlc3Rpb25HZW5lcmFsQXBwcm92YWw/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvblNlcnZpY2VRdWFsaXR5PzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25FYXNlT2ZVc2U/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvblVzZXJTdXBwb3J0PzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25IZWxwR3VpZGVzPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25Jc1ByZW1pdW1Vc2VyPzogYm9vbGVhbiB8IG51bGw7XG5cdHF1ZXN0aW9uUHJlbWl1bVZhbHVlPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25MaWtlbGlob29kVG9SZWNvbW1lbmQ/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvblVzZWZ1bEZlYXR1cmVzQW5kQXNwZWN0cz86IG9iamVjdCB8IG51bGw7XG5cdHF1ZXN0aW9uRmVhdHVyZXNUaGF0TmVlZEltcHJvdmVtZW50Pzogb2JqZWN0IHwgbnVsbDtcblx0cXVlc3Rpb25PcGVuRW5kZWRMaWtlVGhlTW9zdD86IHN0cmluZyB8IG51bGw7XG5cdHF1ZXN0aW9uT3BlbkVuZGVkV2hhdENhbldlSW1wcm92ZT86IHN0cmluZyB8IG51bGw7XG5cdHF1ZXN0aW9uRGVtb0hlYXJkQWJvdXRVcz86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uRGVtb0FnZUdyb3VwPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vR2VuZGVyPzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vUmVnaW9uPzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vTGFuZ1ByZWY/OiBzdHJpbmcgfCBudWxsO1xuXHRxdWVzdGlvbkZpbmFsVGhvdWdodHM/OiBzdHJpbmcgfCBudWxsO1xuXHRoYXNPcHRlZEluRm9yRm9sbG93VXA/OiBib29sZWFuIHwgbnVsbDtcblx0ZW1haWw/OiBzdHJpbmcgfCBudWxsO1xuXHRzdXJ2ZXlEYXRlITogRGF0ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgRmVlZGJhY2tTdXJ2ZXk7XG4iXX0=
