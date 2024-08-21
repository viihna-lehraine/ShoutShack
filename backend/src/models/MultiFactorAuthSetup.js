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
		let sequelize = yield initializeDatabase();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVsdGlGYWN0b3JBdXRoU2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvTXVsdGlGYWN0b3JBdXRoU2V0dXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUlMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBZXRDLE1BQU0sb0JBQ0wsU0FBUSxLQUdQO0lBSkY7O1FBT0M7Ozs7O1dBQVk7UUFDWjs7Ozs7V0FBZTtRQUNmOzs7OztXQUFnQjtRQUNoQjs7Ozs7V0FBMkQ7UUFDM0Q7Ozs7O1dBQXVCO1FBQ3ZCOzs7OztXQUEwQjtRQUMxQjs7Ozs7V0FBd0I7UUFDeEI7Ozs7O1dBQW1CO1FBQ25COzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBbUM7SUFDcEMsQ0FBQztDQUFBO0FBRUQsU0FBZSxtQ0FBbUM7O1FBR2pELElBQUksU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUUzQyxvQkFBb0IsQ0FBQyxJQUFJLENBQ3hCO1lBQ0MsRUFBRSxFQUFFO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFVBQVUsRUFBRTtvQkFDWCxLQUFLLEVBQUUsTUFBTSxnQkFBZ0I7b0JBQzdCLEdBQUcsRUFBRSxJQUFJO2lCQUNUO2FBQ0Q7WUFDRCxLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTthQUNaO1lBQ0QsTUFBTSxFQUFFO2dCQUNQLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQ25CLE1BQU0sRUFDTixPQUFPLEVBQ1AsUUFBUSxFQUNSLE9BQU8sRUFDUCxTQUFTLENBQ1Q7Z0JBQ0QsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNO2dCQUN0QixTQUFTLEVBQUUsSUFBSTthQUNmO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsU0FBUyxFQUFFLElBQUk7YUFDZjtZQUNELE9BQU8sRUFBRTtnQkFDUixJQUFJLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ3ZCLFNBQVMsRUFBRSxJQUFJO2FBQ2Y7WUFDRCxRQUFRLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUN2QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsU0FBUyxFQUFFLEtBQUs7YUFDaEI7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2FBQ2hCO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDcEIsWUFBWSxFQUFFLFNBQVMsQ0FBQyxHQUFHO2dCQUMzQixTQUFTLEVBQUUsS0FBSzthQUNoQjtTQUNELEVBQ0Q7WUFDQyxTQUFTO1lBQ1QsU0FBUyxFQUFFLHNCQUFzQjtZQUNqQyxVQUFVLEVBQUUsSUFBSTtTQUNoQixDQUNELENBQUM7UUFFRixNQUFNLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2xDLE9BQU8sb0JBQW9CLENBQUM7SUFDN0IsQ0FBQztDQUFBO0FBRUQsTUFBTSxnQ0FBZ0MsR0FBRyxtQ0FBbUMsRUFBRSxDQUFDO0FBQy9FLGVBQWUsZ0NBQWdDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuXHREYXRhVHlwZXMsXG5cdE1vZGVsLFxuXHRJbmZlckF0dHJpYnV0ZXMsXG5cdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzLFxuXHRDcmVhdGlvbk9wdGlvbmFsXG59IGZyb20gJ3NlcXVlbGl6ZSc7XG5pbXBvcnQgaW5pdGlhbGl6ZURhdGFiYXNlIGZyb20gJy4uL2NvbmZpZy9kYic7XG5pbXBvcnQgVXNlck1vZGVsUHJvbWlzZSBmcm9tICcuL1VzZXInO1xuXG5pbnRlcmZhY2UgTXVsdGlGYWN0b3JBdXRoU2V0dXBBdHRyaWJ1dGVzIHtcblx0aWQ6IHN0cmluZztcblx0bWZhSWQ6IG51bWJlcjtcblx0dXNlcklkOiBzdHJpbmc7XG5cdG1ldGhvZDogJ3RvdHAnIHwgJ2VtYWlsJyB8ICd5dWJpY28nIHwgJ2ZpZG8yJyB8ICdwYXNza2V5Jztcblx0c2VjcmV0Pzogc3RyaW5nIHwgbnVsbDtcblx0cHVibGljS2V5Pzogc3RyaW5nIHwgbnVsbDtcblx0Y291bnRlcj86IG51bWJlciB8IG51bGw7XG5cdGlzQWN0aXZlOiBib29sZWFuO1xuXHRjcmVhdGVkQXQ6IERhdGU7XG5cdHVwZGF0ZWRBdDogRGF0ZTtcbn1cblxuY2xhc3MgTXVsdGlGYWN0b3JBdXRoU2V0dXBcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8TXVsdGlGYWN0b3JBdXRoU2V0dXA+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPE11bHRpRmFjdG9yQXV0aFNldHVwPlxuXHQ+XG5cdGltcGxlbWVudHMgTXVsdGlGYWN0b3JBdXRoU2V0dXBBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRtZmFJZCE6IG51bWJlcjtcblx0dXNlcklkITogc3RyaW5nO1xuXHRtZXRob2QhOiAndG90cCcgfCAnZW1haWwnIHwgJ3l1YmljbycgfCAnZmlkbzInIHwgJ3Bhc3NrZXknO1xuXHRzZWNyZXQhOiBzdHJpbmcgfCBudWxsO1xuXHRwdWJsaWNLZXkhOiBzdHJpbmcgfCBudWxsO1xuXHRjb3VudGVyITogbnVtYmVyIHwgbnVsbDtcblx0aXNBY3RpdmUhOiBib29sZWFuO1xuXHRjcmVhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xuXHR1cGRhdGVkQXQhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplTXVsdGlGYWN0b3JBdXRoU2V0dXBNb2RlbCgpOiBQcm9taXNlPFxuXHR0eXBlb2YgTXVsdGlGYWN0b3JBdXRoU2V0dXBcbj4ge1xuXHRsZXQgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cblx0TXVsdGlGYWN0b3JBdXRoU2V0dXAuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogYXdhaXQgVXNlck1vZGVsUHJvbWlzZSxcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdG1mYUlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5JTlRFR0VSLFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhdXRvSW5jcmVtZW50OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHR1c2VySWQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlVVSUQsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRtZXRob2Q6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkVOVU0oXG5cdFx0XHRcdFx0J3RvdHAnLFxuXHRcdFx0XHRcdCdlbWFpbCcsXG5cdFx0XHRcdFx0J3l1YmljbycsXG5cdFx0XHRcdFx0J2ZpZG8yJyxcblx0XHRcdFx0XHQncGFzc2tleSdcblx0XHRcdFx0KSxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHNlY3JldDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRwdWJsaWNLZXk6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlRFWFQsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGNvdW50ZXI6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLklOVEVHRVIsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGlzQWN0aXZlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5CT09MRUFOLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRjcmVhdGVkQXQ6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdHVwZGF0ZWRBdDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuREFURSxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuTk9XLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR7XG5cdFx0XHRzZXF1ZWxpemUsXG5cdFx0XHRtb2RlbE5hbWU6ICdNdWx0aUZhY3RvckF1dGhTZXR1cCcsXG5cdFx0XHR0aW1lc3RhbXBzOiB0cnVlXG5cdFx0fVxuXHQpO1xuXG5cdGF3YWl0IE11bHRpRmFjdG9yQXV0aFNldHVwLnN5bmMoKTtcblx0cmV0dXJuIE11bHRpRmFjdG9yQXV0aFNldHVwO1xufVxuXG5jb25zdCBNdWx0aUZhY3RvckF1dGhTZXR1cE1vZGVsUHJvbWlzZSA9IGluaXRpYWxpemVNdWx0aUZhY3RvckF1dGhTZXR1cE1vZGVsKCk7XG5leHBvcnQgZGVmYXVsdCBNdWx0aUZhY3RvckF1dGhTZXR1cE1vZGVsUHJvbWlzZTtcbiJdfQ==
