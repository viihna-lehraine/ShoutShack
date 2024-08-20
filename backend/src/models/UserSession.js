import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db';
import UserModelPromise from './User';
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
		const sequelize = yield initializeDatabase();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlclNlc3Npb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvVXNlclNlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUlMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBY3RDLE1BQU0sV0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBZ0I7UUFDaEI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQjtRQUNuQjs7Ozs7V0FBbUM7UUFDbkM7Ozs7O1dBQXdCO1FBQ3hCOzs7OztXQUFpQjtRQUNqQjs7Ozs7V0FBbUI7SUFDcEIsQ0FBQztDQUFBO0FBRUQsU0FBZSwwQkFBMEI7O1FBQ3hDLE1BQU0sU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxXQUFXLENBQUMsSUFBSSxDQUNmO1lBQ0MsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRTtvQkFDWCxLQUFLLEVBQUUsTUFBTSxnQkFBZ0I7b0JBQzdCLEdBQUcsRUFBRSxJQUFJO2lCQUNUO2FBQ0Q7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTthQUNaO1lBQ0QsTUFBTSxFQUFFO2dCQUNQLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELFNBQVMsRUFBRTtnQkFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsWUFBWSxFQUFFLElBQUk7YUFDbEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsS0FBSzthQUNoQjtZQUNELFFBQVEsRUFBRTtnQkFDVCxJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFlBQVksRUFBRSxJQUFJO2FBQ2xCO1NBQ0QsRUFDRDtZQUNDLFNBQVM7WUFDVCxTQUFTLEVBQUUsYUFBYTtZQUN4QixVQUFVLEVBQUUsSUFBSTtZQUNoQixLQUFLLEVBQUU7Z0JBQ04sWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7b0JBQ3pCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQzFCLE9BQU8sQ0FBQyxTQUFrQixDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQ2xELENBQUMsQ0FBQyxpRUFBaUU7Z0JBQ3JFLENBQUM7Z0JBQ0QsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7b0JBQ3pCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLDZDQUE2QztnQkFDOUUsQ0FBQzthQUNEO1NBQ0QsQ0FDRCxDQUFDO1FBRUYsTUFBTSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekIsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQztDQUFBO0FBRUQsTUFBTSx1QkFBdUIsR0FBRywwQkFBMEIsRUFBRSxDQUFDO0FBQzdELGVBQWUsdUJBQXVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRDcmVhdGlvbk9wdGlvbmFsXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgVXNlck1vZGVsUHJvbWlzZSBmcm9tICcuL1VzZXInO1xuXG5pbnRlcmZhY2UgVXNlclNlc3Npb25BdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZztcblx0c2Vzc2lvbklkOiBudW1iZXI7XG5cdHVzZXJJZDogc3RyaW5nO1xuXHRpcEFkZHJlc3M6IHN0cmluZztcblx0dXNlckFnZW50OiBzdHJpbmc7XG5cdGNyZWF0ZWRBdDogRGF0ZTtcblx0dXBkYXRlZEF0PzogRGF0ZSB8IG51bGw7XG5cdGV4cGlyZXNBdDogRGF0ZTtcblx0aXNBY3RpdmU6IGJvb2xlYW47XG59XG5cbmNsYXNzIFVzZXJTZXNzaW9uXG5cdGV4dGVuZHMgTW9kZWw8XG5cdFx0SW5mZXJBdHRyaWJ1dGVzPFVzZXJTZXNzaW9uPixcblx0XHRJbmZlckNyZWF0aW9uQXR0cmlidXRlczxVc2VyU2Vzc2lvbj5cblx0PlxuXHRpbXBsZW1lbnRzIFVzZXJTZXNzaW9uQXR0cmlidXRlc1xue1xuXHRpZCE6IHN0cmluZztcblx0c2Vzc2lvbklkITogbnVtYmVyO1xuXHR1c2VySWQhOiBzdHJpbmc7XG5cdGlwQWRkcmVzcyE6IHN0cmluZztcblx0dXNlckFnZW50ITogc3RyaW5nO1xuXHRjcmVhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHR1cGRhdGVkQXQhOiBEYXRlIHwgbnVsbDtcblx0ZXhwaXJlc0F0ITogRGF0ZTtcblx0aXNBY3RpdmUhOiBib29sZWFuO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplVXNlclNlc3Npb25Nb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBVc2VyU2Vzc2lvbj4ge1xuXHRjb25zdCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblxuXHRVc2VyU2Vzc2lvbi5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBhd2FpdCBVc2VyTW9kZWxQcm9taXNlLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0c2Vzc2lvbklkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR1c2VySWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLlVVSURWNCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGlwQWRkcmVzczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dXNlckFnZW50OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVwZGF0ZWRBdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IG51bGxcblx0XHRcdH0sXG5cdFx0XHRleHBpcmVzQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRpc0FjdGl2ZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuQk9PTEVBTixcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdVc2VyU2Vzc2lvbicsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlLFxuXHRcdFx0aG9va3M6IHtcblx0XHRcdFx0YmVmb3JlQ3JlYXRlOiAoc2Vzc2lvbikgPT4ge1xuXHRcdFx0XHRcdHNlc3Npb24uZXhwaXJlc0F0ID0gbmV3IERhdGUoXG5cdFx0XHRcdFx0XHQoc2Vzc2lvbi5jcmVhdGVkQXQgYXMgRGF0ZSkuZ2V0VGltZSgpICsgNjAgKiA2MDAwMFxuXHRcdFx0XHRcdCk7IC8vIGRlZmF1bHQgZXhwaXJhdGlvbiB0aW1lIGlzIDYwIG1pbnV0ZXMgYWZ0ZXIgc2Vzc2lvbiBnZW5lcmF0aW9uXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGJlZm9yZVVwZGF0ZTogKHNlc3Npb24pID0+IHtcblx0XHRcdFx0XHRzZXNzaW9uLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7IC8vIFVwZGF0ZSB0aGUgdXBkYXRlZEF0IGZpZWxkIG9uIGV2ZXJ5IHVwZGF0ZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHQpO1xuXG5cdGF3YWl0IFVzZXJTZXNzaW9uLnN5bmMoKTtcblx0cmV0dXJuIFVzZXJTZXNzaW9uO1xufVxuXG5jb25zdCBVc2VyU2Vzc2lvbk1vZGVsUHJvbWlzZSA9IGluaXRpYWxpemVVc2VyU2Vzc2lvbk1vZGVsKCk7XG5leHBvcnQgZGVmYXVsdCBVc2VyU2Vzc2lvbk1vZGVsUHJvbWlzZTtcbiJdfQ==
