import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';
class MultiFactorAuthSetup extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'mfaId', {
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
function initializeMultiFactorAuthSetupModel() {
	return __awaiter(this, void 0, void 0, function* () {
		const sequelize = yield initializeDatabase();
		MultiFactorAuthSetup.init(
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
				mfaId: {
					type: DataTypes.INTEGER,
					primaryKey: true,
					autoIncrement: true,
					allowNull: false,
					unique: true
				},
				userId: {
					type: DataTypes.UUID,
					allowNull: false
				},
				method: {
					type: DataTypes.ENUM(
						'totp',
						'email',
						'yubico',
						'fido2',
						'passkey'
					),
					allowNull: false
				},
				secret: {
					type: DataTypes.STRING,
					allowNull: true
				},
				publicKey: {
					type: DataTypes.TEXT,
					allowNull: true
				},
				counter: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				isActive: {
					type: DataTypes.BOOLEAN,
					defaultValue: true,
					allowNull: false
				},
				createdAt: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				},
				updatedAt: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false
				}
			},
			{
				sequelize,
				modelName: 'MultiFactorAuthSetup',
				timestamps: true
			}
		);
		yield MultiFactorAuthSetup.sync();
		return MultiFactorAuthSetup;
	});
}
const MultiFactorAuthSetupModelPromise = initializeMultiFactorAuthSetupModel();
export default MultiFactorAuthSetupModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVsdGlGYWN0b3JBdXRoU2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvTXVsdGlGYWN0b3JBdXRoU2V0dXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUlMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBZXRDLE1BQU0sb0JBQ0wsU0FBUSxLQUdQO0lBSkY7O1FBT0M7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBZTtRQUNmOzs7OztXQUFnQjtRQUNoQjs7Ozs7V0FBMkQ7UUFDM0Q7Ozs7O1dBQXVCO1FBQ3ZCOzs7OztXQUEwQjtRQUMxQjs7Ozs7V0FBd0I7UUFDeEI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBbUM7SUFDcEMsQ0FBQztDQUFBO0FBRUQsU0FBZSxtQ0FBbUM7O1FBR2pELE1BQU0sU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxvQkFBb0IsQ0FBQyxJQUFJLENBQ3hCO1lBQ0MsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRTtvQkFDWCxLQUFLLEVBQUUsTUFBTSxnQkFBZ0I7b0JBQzdCLEdBQUcsRUFBRSxJQUFJO2lCQUNUO2FBQ0Q7WUFDRCxLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTthQUNaO1lBQ0QsTUFBTSxFQUFFO2dCQUNQLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQ25CLE1BQU0sRUFDTixPQUFPLEVBQ1AsUUFBUSxFQUNSLE9BQU8sRUFDUCxTQUFTLENBQ1Q7Z0JBQ0QsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELE9BQU8sRUFBRTtnQkFDUixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2dCQUMzQixTQUFTLEVBQUUsS0FBSzthQUNoQjtTQUNELEVBQ0Q7WUFDQyxTQUFTO1lBQ1QsU0FBUyxFQUFFLHNCQUFzQjtZQUNqQyxVQUFVLEVBQUUsSUFBSTtTQUNoQixDQUNELENBQUM7UUFFRixNQUFNLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2xDLE9BQU8sb0JBQW9CLENBQUM7SUFDN0IsQ0FBQztDQUFBO0FBRUQsTUFBTSxnQ0FBZ0MsR0FBRyxtQ0FBbUMsRUFBRSxDQUFDO0FBQy9FLGVBQWUsZ0NBQWdDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRDcmVhdGlvbk9wdGlvbmFsXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgVXNlck1vZGVsUHJvbWlzZSBmcm9tICcuL1VzZXInO1xuXG5pbnRlcmZhY2UgTXVsdGlGYWN0b3JBdXRoU2V0dXBBdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZztcblx0bWZhSWQ6IG51bWJlcjtcblx0dXNlcklkOiBzdHJpbmc7XG5cdG1ldGhvZDogJ3RvdHAnIHwgJ2VtYWlsJyB8ICd5dWJpY28nIHwgJ2ZpZG8yJyB8ICdwYXNza2V5Jztcblx0c2VjcmV0Pzogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljS2V5Pzogc3RyaW5nIHwgbnVsbDtcblx0Y291bnRlcj86IG51bWJlciB8IG51bGw7XG5cdGlzQWN0aXZlOiBib29sZWFuO1xuXHRjcmVhdGVkQXQ6IERhdGU7XG5cdHVwZGF0ZWRBdDogRGF0ZTtcbn1cblxuY2xhc3MgTXVsdGlGYWN0b3JBdXRoU2V0dXBcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8TXVsdGlGYWN0b3JBdXRoU2V0dXA+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPE11bHRpRmFjdG9yQXV0aFNldHVwPlxuXHQ+XG5cdGltcGxlbWVudHMgTXVsdGlGYWN0b3JBdXRoU2V0dXBBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRtZmFJZCE6IG51bWJlcjtcblx0dXNlcklkITogc3RyaW5nO1xuXHRtZXRob2QhOiAndG90cCcgfCAnZW1haWwnIHwgJ3l1YmljbycgfCAnZmlkbzInIHwgJ3Bhc3NrZXknO1xuXHRzZWNyZXQhOiBzdHJpbmcgfCBudWxsO1xuXHRwdWJsaWNLZXkhOiBzdHJpbmcgfCBudWxsO1xuXHRjb3VudGVyITogbnVtYmVyIHwgbnVsbDtcblx0aXNBY3RpdmUhOiBib29sZWFuO1xuXHRjcmVhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHR1cGRhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplTXVsdGlGYWN0b3JBdXRoU2V0dXBNb2RlbCgpOiBQcm9taXNlPFxuXHR0eXBlb2YgTXVsdGlGYWN0b3JBdXRoU2V0dXBcbj4ge1xuXHRjb25zdCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblxuXHRNdWx0aUZhY3RvckF1dGhTZXR1cC5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBhd2FpdCBVc2VyTW9kZWxQcm9taXNlLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0bWZhSWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGF1dG9JbmNyZW1lbnQ6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHVzZXJJZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdG1ldGhvZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuRU5VTShcblx0XHRcdFx0XHQndG90cCcsXG5cdFx0XHRcdFx0J2VtYWlsJyxcblx0XHRcdFx0XHQneXViaWNvJyxcblx0XHRcdFx0XHQnZmlkbzInLFxuXHRcdFx0XHRcdCdwYXNza2V5J1xuXHRcdFx0XHQpLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c2VjcmV0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHB1YmxpY0tleToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0Y291bnRlcjoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSU5URUdFUixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aXNBY3RpdmU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkJPT0xFQU4sXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogdHJ1ZSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGNyZWF0ZWRBdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dXBkYXRlZEF0OiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ011bHRpRmFjdG9yQXV0aFNldHVwJyxcblx0XHRcdHRpbWVzdGFtcHM6IHRydWVcblx0XHR9XG5cdCk7XG5cblx0YXdhaXQgTXVsdGlGYWN0b3JBdXRoU2V0dXAuc3luYygpO1xuXHRyZXR1cm4gTXVsdGlGYWN0b3JBdXRoU2V0dXA7XG59XG5cbmNvbnN0IE11bHRpRmFjdG9yQXV0aFNldHVwTW9kZWxQcm9taXNlID0gaW5pdGlhbGl6ZU11bHRpRmFjdG9yQXV0aFNldHVwTW9kZWwoKTtcbmV4cG9ydCBkZWZhdWx0IE11bHRpRmFjdG9yQXV0aFNldHVwTW9kZWxQcm9taXNlO1xuIl19
