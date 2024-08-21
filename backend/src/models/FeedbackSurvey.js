import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
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
function initializeFeedbackSurveyModel() {
	return __awaiter(this, void 0, void 0, function* () {
		let sequelize = yield initializeDatabase();
		FeedbackSurvey.init(
			{
				surveyId: {
					type: DataTypes.INTEGER,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				questionGeneralApproval: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 1,
						max: 5
					}
				},
				questionServiceQuality: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 1,
						max: 5
					}
				},
				questionEaseOfUse: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 1,
						max: 5
					}
				},
				questionUserSupport: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 0, // allows for N/A
						max: 5
					}
				},
				questionHelpGuides: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 0, // allows for N/A
						max: 5
					}
				},
				questionIsPremiumUser: {
					type: DataTypes.BOOLEAN,
					allowNull: true
				},
				questionPremiumValue: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 0,
						max: 5
					}
				},
				questionLikelihoodToRecommend: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 1,
						max: 5
					}
				},
				questionUsefulFeaturesAndAspects: {
					// checklist; last option is Other and user can define it
					type: DataTypes.JSON,
					allowNull: true,
					defaultValue: []
				},
				questionFeaturesThatNeedImprovement: {
					type: DataTypes.JSON,
					allowNull: true,
					defaultValue: []
				},
				questionOpenEndedLikeTheMost: {
					type: DataTypes.TEXT,
					allowNull: true,
					defaultValue: ''
				},
				questionOpenEndedWhatCanWeImprove: {
					type: DataTypes.TEXT,
					allowNull: true,
					defaultValue: ''
				},
				questionDemoHeardAboutUs: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 1,
						max: 5
					}
				},
				questionDemoAgeGroup: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						min: 1,
						max: 7
					}
				},
				questionDemoGender: {
					type: DataTypes.STRING,
					allowNull: true
				},
				questionDemoRegion: {
					type: DataTypes.STRING,
					allowNull: true
				},
				questionDemoLangPref: {
					type: DataTypes.STRING,
					allowNull: true
				},
				questionFinalThoughts: {
					type: DataTypes.TEXT,
					allowNull: true,
					defaultValue: ''
				},
				hasOptedInForFollowUp: {
					type: DataTypes.BOOLEAN,
					allowNull: true,
					defaultValue: false
				},
				email: {
					type: DataTypes.STRING,
					allowNull: true,
					defaultValue: ''
				},
				surveyDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'FeedbackSurvey',
				timestamps: true
			}
		);
		yield FeedbackSurvey.sync();
		return FeedbackSurvey;
	});
}
// Export the initialized model
const FeedbackSurveyModelPromise = initializeFeedbackSurveyModel();
export default FeedbackSurveyModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmVlZGJhY2tTdXJ2ZXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvRmVlZGJhY2tTdXJ2ZXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUdMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBMkI5QyxNQUFNLGNBQ0wsU0FBUSxLQUdQO0lBSkY7O1FBT0M7Ozs7O1dBQWtCO1FBQ2xCOzs7OztXQUF3QztRQUN4Qzs7Ozs7V0FBdUM7UUFDdkM7Ozs7O1dBQWtDO1FBQ2xDOzs7OztXQUFvQztRQUNwQzs7Ozs7V0FBbUM7UUFDbkM7Ozs7O1dBQXVDO1FBQ3ZDOzs7OztXQUFxQztRQUNyQzs7Ozs7V0FBOEM7UUFDOUM7Ozs7O1dBQWlEO1FBQ2pEOzs7OztXQUFvRDtRQUNwRDs7Ozs7V0FBNkM7UUFDN0M7Ozs7O1dBQWtEO1FBQ2xEOzs7OztXQUF5QztRQUN6Qzs7Ozs7V0FBcUM7UUFDckM7Ozs7O1dBQW1DO1FBQ25DOzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBcUM7UUFDckM7Ozs7O1dBQXNDO1FBQ3RDOzs7OztXQUF1QztRQUN2Qzs7Ozs7V0FBc0I7UUFDdEI7Ozs7O1dBQWtCO0lBQ25CLENBQUM7Q0FBQTtBQUVELFNBQWUsNkJBQTZCOztRQUMzQyxJQUFJLFNBQVMsR0FBRyxNQUFNLGtCQUFrQixFQUFFLENBQUM7UUFFM0MsY0FBYyxDQUFDLElBQUksQ0FDbEI7WUFDQyxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2FBQ1o7WUFDRCx1QkFBdUIsRUFBRTtnQkFDeEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixTQUFTLEVBQUUsSUFBSTtnQkFDZixRQUFRLEVB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QUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxvQkFBb0IsRUFBRTtnQkFDckIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QscUJBQXFCLEVBQUU7Z0JBQ3RCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsWUFBWSxFQUFFLEVBQUU7YUFDaEI7WUFDRCxxQkFBcUIsRUFBRTtnQkFDdEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixTQUFTLEVBQUUsSUFBSTtnQkFDZixZQUFZLEVBQUUsS0FBSzthQUNuQjtZQUNELEtBQUssRUFBRTtnQkFDTixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFlBQVksRUFBRSxFQUFFO2FBQ2hCO1lBQ0QsVUFBVSxFQUFFO2dCQUNYLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2dCQUMzQixTQUFTLEVBQUUsS0FBSzthQUNoQjtTQUNELEVBQ0Q7WUFDQyxTQUFTO1lBQ1QsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixVQUFVLEVBQUUsSUFBSTtTQUNoQixDQUNELENBQUM7UUFFRixNQUFNLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixPQUFPLGNBQWMsQ0FBQztJQUN2QixDQUFDO0NBQUE7QUFFRCwrQkFBK0I7QUFDL0IsTUFBTSwwQkFBMEIsR0FBRyw2QkFBNkIsRUFBRSxDQUFDO0FBQ25FLGVBQWUsMEJBQTBCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5cbmludGVyZmFjZSBGZWVkYmFja1N1cnZleUF0dHJpYnV0ZXMge1xuXHRzdXJ2ZXlJZDogc3RyaW5nO1xuXHRxdWVzdGlvbkdlbmVyYWxBcHByb3ZhbD86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uU2VydmljZVF1YWxpdHk/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkVhc2VPZlVzZT86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uVXNlclN1cHBvcnQ/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkhlbHBHdWlkZXM/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbklzUHJlbWl1bVVzZXI/OiBib29sZWFuIHwgbnVsbDtcblx0cXVlc3Rpb25QcmVtaXVtVmFsdWU/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkxpa2VsaWhvb2RUb1JlY29tbWVuZD86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uVXNlZnVsRmVhdHVyZXNBbmRBc3BlY3RzPzogb2JqZWN0IHwgbnVsbDtcblx0cXVlc3Rpb25GZWF0dXJlc1RoYXROZWVkSW1wcm92ZW1lbnQ/OiBvYmplY3QgfCBudWxsO1xuXHRxdWVzdGlvbk9wZW5FbmRlZExpa2VUaGVNb3N0Pzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25PcGVuRW5kZWRXaGF0Q2FuV2VJbXByb3ZlPzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vSGVhcmRBYm91dFVzPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vQWdlR3JvdXA/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvbkRlbW9HZW5kZXI/OiBzdHJpbmcgfCBudWxsO1xuXHRxdWVzdGlvbkRlbW9SZWdpb24/OiBzdHJpbmcgfCBudWxsO1xuXHRxdWVzdGlvbkRlbW9MYW5nUHJlZj86IHN0cmluZyB8IG51bGw7XG5cdHF1ZXN0aW9uRmluYWxUaG91Z2h0cz86IHN0cmluZyB8IG51bGw7XG5cdGhhc09wdGVkSW5Gb3JGb2xsb3dVcD86IGJvb2xlYW4gfCBudWxsO1xuXHRlbWFpbD86IHN0cmluZyB8IG51bGw7XG5cdHN1cnZleURhdGU6IERhdGU7XG59XG5cbmNsYXNzIEZlZWRiYWNrU3VydmV5XG5cdGV4dGVuZHMgTW9kZWw8XG5cdFx0SW5mZXJBdHRyaWJ1dGVzPEZlZWRiYWNrU3VydmV5Pixcblx0XHRJbmZlckNyZWF0aW9uQXR0cmlidXRlczxGZWVkYmFja1N1cnZleT5cblx0PlxuXHRpbXBsZW1lbnRzIEZlZWRiYWNrU3VydmV5QXR0cmlidXRlc1xue1xuXHRzdXJ2ZXlJZCE6IHN0cmluZztcblx0cXVlc3Rpb25HZW5lcmFsQXBwcm92YWw/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvblNlcnZpY2VRdWFsaXR5PzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25FYXNlT2ZVc2U/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvblVzZXJTdXBwb3J0PzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25IZWxwR3VpZGVzPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25Jc1ByZW1pdW1Vc2VyPzogYm9vbGVhbiB8IG51bGw7XG5cdHF1ZXN0aW9uUHJlbWl1bVZhbHVlPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25MaWtlbGlob29kVG9SZWNvbW1lbmQ/OiBudW1iZXIgfCBudWxsO1xuXHRxdWVzdGlvblVzZWZ1bEZlYXR1cmVzQW5kQXNwZWN0cz86IG9iamVjdCB8IG51bGw7XG5cdHF1ZXN0aW9uRmVhdHVyZXNUaGF0TmVlZEltcHJvdmVtZW50Pzogb2JqZWN0IHwgbnVsbDtcblx0cXVlc3Rpb25PcGVuRW5kZWRMaWtlVGhlTW9zdD86IHN0cmluZyB8IG51bGw7XG5cdHF1ZXN0aW9uT3BlbkVuZGVkV2hhdENhbldlSW1wcm92ZT86IHN0cmluZyB8IG51bGw7XG5cdHF1ZXN0aW9uRGVtb0hlYXJkQWJvdXRVcz86IG51bWJlciB8IG51bGw7XG5cdHF1ZXN0aW9uRGVtb0FnZUdyb3VwPzogbnVtYmVyIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vR2VuZGVyPzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vUmVnaW9uPzogc3RyaW5nIHwgbnVsbDtcblx0cXVlc3Rpb25EZW1vTGFuZ1ByZWY/OiBzdHJpbmcgfCBudWxsO1xuXHRxdWVzdGlvbkZpbmFsVGhvdWdodHM/OiBzdHJpbmcgfCBudWxsO1xuXHRoYXNPcHRlZEluRm9yRm9sbG93VXA/OiBib29sZWFuIHwgbnVsbDtcblx0ZW1haWw/OiBzdHJpbmcgfCBudWxsO1xuXHRzdXJ2ZXlEYXRlITogRGF0ZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZUZlZWRiYWNrU3VydmV5TW9kZWwoKTogUHJvbWlzZTx0eXBlb2YgRmVlZGJhY2tTdXJ2ZXk+IHtcblx0bGV0IHNlcXVlbGl6ZSA9IGF3YWl0IGluaXRpYWxpemVEYXRhYmFzZSgpO1xuXG5cdEZlZWRiYWNrU3VydmV5LmluaXQoXG5cdFx0e1xuXHRcdFx0c3VydmV5SWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uR2VuZXJhbEFwcHJvdmFsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25TZXJ2aWNlUXVhbGl0eToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMSxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRWFzZU9mVXNlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25Vc2VyU3VwcG9ydDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMCwgLy8gYWxsb3dzIGZvciBOL0Fcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uSGVscEd1aWRlczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMCwgLy8gYWxsb3dzIGZvciBOL0Fcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uSXNQcmVtaXVtVXNlcjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25QcmVtaXVtVmFsdWU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDAsXG5cdFx0XHRcdFx0bWF4OiA1XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkxpa2VsaWhvb2RUb1JlY29tbWVuZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR2YWxpZGF0ZToge1xuXHRcdFx0XHRcdG1pbjogMSxcblx0XHRcdFx0XHRtYXg6IDVcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uVXNlZnVsRmVhdHVyZXNBbmRBc3BlY3RzOiB7XG5cdFx0XHRcdC8vIGNoZWNrbGlzdDsgbGFzdCBvcHRpb24gaXMgT3RoZXIgYW5kIHVzZXIgY2FuIGRlZmluZSBpdFxuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSlNPTixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IFtdXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25GZWF0dXJlc1RoYXROZWVkSW1wcm92ZW1lbnQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkpTT04sXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBbXVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uT3BlbkVuZGVkTGlrZVRoZU1vc3Q6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiAnJ1xuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uT3BlbkVuZGVkV2hhdENhbldlSW1wcm92ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6ICcnXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vSGVhcmRBYm91dFVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHZhbGlkYXRlOiB7XG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdG1heDogNVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vQWdlR3JvdXA6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dmFsaWRhdGU6IHtcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0bWF4OiA3XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRxdWVzdGlvbkRlbW9HZW5kZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cXVlc3Rpb25EZW1vUmVnaW9uOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRGVtb0xhbmdQcmVmOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHF1ZXN0aW9uRmluYWxUaG91Z2h0czoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6ICcnXG5cdFx0XHR9LFxuXHRcdFx0aGFzT3B0ZWRJbkZvckZvbGxvd1VwOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRlbWFpbDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogJydcblx0XHRcdH0sXG5cdFx0XHRzdXJ2ZXlEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0ZlZWRiYWNrU3VydmV5Jyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0YXdhaXQgRmVlZGJhY2tTdXJ2ZXkuc3luYygpO1xuXHRyZXR1cm4gRmVlZGJhY2tTdXJ2ZXk7XG59XG5cbi8vIEV4cG9ydCB0aGUgaW5pdGlhbGl6ZWQgbW9kZWxcbmNvbnN0IEZlZWRiYWNrU3VydmV5TW9kZWxQcm9taXNlID0gaW5pdGlhbGl6ZUZlZWRiYWNrU3VydmV5TW9kZWwoKTtcbmV4cG9ydCBkZWZhdWx0IEZlZWRiYWNrU3VydmV5TW9kZWxQcm9taXNlO1xuIl19
