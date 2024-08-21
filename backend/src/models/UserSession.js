import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';
class UserSession extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'sessionId', {
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
		Object.defineProperty(this, 'expiresAt', {
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
	}
}
function initializeUserSessionModel() {
	return __awaiter(this, void 0, void 0, function* () {
		let sequelize = yield initializeDatabase();
		UserSession.init(
			{
				id: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					primaryKey: true,
					allowNull: false,
					unique: true,
					references: {
						model: yield UserModelPromise,
						key: 'id'
					}
				},
				sessionId: {
					type: DataTypes.INTEGER,
					primaryKey: true,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				userId: {
					type: DataTypes.UUID,
					defaultValue: DataTypes.UUIDV4,
					allowNull: false
				},
				ipAddress: {
					type: DataTypes.STRING,
					allowNull: false
				},
				userAgent: {
					type: DataTypes.STRING,
					allowNull: false
				},
				createdAt: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				updatedAt: {
					type: DataTypes.DATE,
					allowNull: true,
					defaultValue: null
				},
				expiresAt: {
					type: DataTypes.DATE,
					allowNull: false
				},
				isActive: {
					type: DataTypes.BOOLEAN,
					defaultValue: true
				}
			},
			{
				sequelize,
				modelName: 'UserSession',
				timestamps: true,
				hooks: {
					beforeCreate: (session) => {
						session.expiresAt = new Date(
							session.createdAt.getTime() + 60 * 60000
						); // default expiration time is 60 minutes after session generation
					},
					beforeUpdate: (session) => {
						session.updatedAt = new Date(); // Update the updatedAt field on every update
					}
				}
			}
		);
		yield UserSession.sync();
		return UserSession;
	});
}
const UserSessionModelPromise = initializeUserSessionModel();
export default UserSessionModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlclNlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvVXNlclNlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUlMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBY3RDLE1BQU0sV0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBZ0I7UUFDaEI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBbUM7UUFDbkM7Ozs7O1dBQXdCO1FBQ3hCOzs7OztXQUFpQjtRQUNqQjs7Ozs7V0FBbUI7SUFDcEIsQ0FBQztDQUFBO0FBRUQsU0FBZSwwQkFBMEI7O1FBQ3hDLElBQUksU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUUzQyxXQUFXLENBQUMsSUFBSSxDQUNmO1lBQ0MsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRTtvQkFDWCxLQUFLLEVBQUUsTUFBTSxnQkFBZ0I7b0JBQzdCLEdBQUcsRUFBRSxJQUFJO2lCQUNUO2FBQ0Q7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTthQUNaO1lBQ0QsTUFBTSxFQUFFO2dCQUNQLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELFNBQVMsRUFBRTtnQkFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsWUFBWSxFQUFFLElBQUk7YUFDbEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELFFBQVEsRUFBRTtnQkFDVCxJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFlBQVksRUFBRSxJQUFJO2FBQ2xCO1NBQ0QsRUFDRDtZQUNDLFNBQVM7WUFDVCxTQUFTLEVBQUUsYUFBYTtZQUN4QixVQUFVLEVBQUUsSUFBSTtZQUNoQixLQUFLLEVBQUU7Z0JBQ04sWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7b0JBQ3pCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQzFCLE9BQU8sQ0FBQyxTQUFrQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQ2xELENBQUMsQ0FBQyxpRUFBaUU7Z0JBQ3JFLENBQUM7Z0JBQ0QsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7b0JBQ3pCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLDZDQUE2QztnQkFDOUUsQ0FBQzthQUNEO1NBQ0QsQ0FDRCxDQUFDO1FBRUYsTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekIsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQztDQUFBO0FBRUQsTUFBTSx1QkFBdUIsR0FBRywwQkFBMEIsRUFBRSxDQUFDO0FBQzdELGVBQWUsdUJBQXVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRDcmVhdGlvbk9wdGlvbmFsXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgVXNlck1vZGVsUHJvbWlzZSBmcm9tICcuL1VzZXInO1xuXG5pbnRlcmZhY2UgVXNlclNlc3Npb25BdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZztcblx0c2Vzc2lvbklkOiBudW1iZXI7XG5cdHVzZXJJZDogc3RyaW5nO1xuXHRpcEFkZHJlc3M6IHN0cmluZztcblx0dXNlckFnZW50OiBzdHJpbmc7XG5cdGNyZWF0ZWRBdDogRGF0ZTtcblx0dXBkYXRlZEF0PzogRGF0ZSB8IG51bGw7XG5cdGV4cGlyZXNBdDogRGF0ZTtcblx0aXNBY3RpdmU6IGJvb2xlYW47XG59XG5cbmNsYXNzIFVzZXJTZXNzaW9uXG5cdGV4dGVuZHMgTW9kZWw8XG5cdFx0SW5mZXJBdHRyaWJ1dGVzPFVzZXJTZXNzaW9uPixcblx0XHRJbmZlckNyZWF0aW9uQXR0cmlidXRlczxVc2VyU2Vzc2lvbj5cblx0PlxuXHRpbXBsZW1lbnRzIFVzZXJTZXNzaW9uQXR0cmlidXRlc1xue1xuXHRpZCE6IHN0cmluZztcblx0c2Vzc2lvbklkITogbnVtYmVyO1xuXHR1c2VySWQhOiBzdHJpbmc7XG5cdGlwQWRkcmVzcyE6IHN0cmluZztcblx0dXNlckFnZW50ITogc3RyaW5nO1xuXHRjcmVhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHR1cGRhdGVkQXQhOiBEYXRlIHwgbnVsbDtcblx0ZXhwaXJlc0F0ITogRGF0ZTtcblx0aXNBY3RpdmUhOiBib29sZWFuO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplVXNlclNlc3Npb25Nb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBVc2VyU2Vzc2lvbj4ge1xuXHRsZXQgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cblx0VXNlclNlc3Npb24uaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogYXdhaXQgVXNlck1vZGVsUHJvbWlzZSxcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHNlc3Npb25JZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0cHJpbWFyeUtleTogdHJ1ZSxcblx0XHRcdFx0YXV0b0luY3JlbWVudDogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0dXNlcklkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpcEFkZHJlc3M6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJBZ2VudDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Y3JlYXRlZEF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHR1cGRhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBudWxsXG5cdFx0XHR9LFxuXHRcdFx0ZXhwaXJlc0F0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0aXNBY3RpdmU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnVXNlclNlc3Npb24nLFxuXHRcdFx0dGltZXN0YW1wczogdHJ1ZSxcblx0XHRcdGhvb2tzOiB7XG5cdFx0XHRcdGJlZm9yZUNyZWF0ZTogKHNlc3Npb24pID0+IHtcblx0XHRcdFx0XHRzZXNzaW9uLmV4cGlyZXNBdCA9IG5ldyBEYXRlKFxuXHRcdFx0XHRcdFx0KHNlc3Npb24uY3JlYXRlZEF0IGFzIERhdGUpLmdldFRpbWUoKSArIDYwICogNjAwMDBcblx0XHRcdFx0XHQpOyAvLyBkZWZhdWx0IGV4cGlyYXRpb24gdGltZSBpcyA2MCBtaW51dGVzIGFmdGVyIHNlc3Npb24gZ2VuZXJhdGlvblxuXHRcdFx0XHR9LFxuXHRcdFx0XHRiZWZvcmVVcGRhdGU6IChzZXNzaW9uKSA9PiB7XG5cdFx0XHRcdFx0c2Vzc2lvbi51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpOyAvLyBVcGRhdGUgdGhlIHVwZGF0ZWRBdCBmaWVsZCBvbiBldmVyeSB1cGRhdGVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0KTtcblxuXHRhd2FpdCBVc2VyU2Vzc2lvbi5zeW5jKCk7XG5cdHJldHVybiBVc2VyU2Vzc2lvbjtcbn1cblxuY29uc3QgVXNlclNlc3Npb25Nb2RlbFByb21pc2UgPSBpbml0aWFsaXplVXNlclNlc3Npb25Nb2RlbCgpO1xuZXhwb3J0IGRlZmF1bHQgVXNlclNlc3Npb25Nb2RlbFByb21pc2U7XG4iXX0=
