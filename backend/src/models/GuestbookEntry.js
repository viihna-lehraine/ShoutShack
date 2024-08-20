import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db';
import UserModelPromise from './User';
class GuestbookEntry extends Model {
	constructor() {
		super(...arguments);
		Object.defineProperty(this, 'id', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'guestName', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'guestEmail', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'guestMessage', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'guestMessageStyles', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, 'entryDate', {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
	}
}
function initializeGuestbookEntryModel() {
	return __awaiter(this, void 0, void 0, function* () {
		const sequelize = yield initializeDatabase();
		GuestbookEntry.init(
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
				guestName: {
					type: DataTypes.STRING,
					allowNull: true,
					unique: false
				},
				guestEmail: {
					type: DataTypes.STRING,
					allowNull: true,
					unique: false
				},
				guestMessage: {
					type: DataTypes.TEXT,
					allowNull: false,
					unique: false
				},
				guestMessageStyles: {
					type: DataTypes.JSON,
					allowNull: true,
					unique: false
				},
				entryDate: {
					type: DataTypes.DATE,
					defaultValue: DataTypes.NOW,
					allowNull: false,
					unique: false
				}
			},
			{
				sequelize,
				modelName: 'GuestbookEntry',
				timestamps: false
			}
		);
		yield GuestbookEntry.sync();
		return GuestbookEntry;
	});
}
// Export the initialized model
const GuestbookEntryModelPromise = initializeGuestbookEntryModel();
export default GuestbookEntryModelPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3Vlc3Rib29rRW50cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvR3Vlc3Rib29rRW50cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUlMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBV3RDLE1BQU0sY0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUEwQjtRQUMxQjs7Ozs7V0FBMkI7UUFDM0I7Ozs7O1dBQXNCO1FBQ3RCOzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBbUM7SUFDcEMsQ0FBQztDQUFBO0FBRUQsU0FBZSw2QkFBNkI7O1FBQzNDLE1BQU0sU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUU3QyxjQUFjLENBQUMsSUFBSSxDQUNsQjtZQUNDLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO29CQUM3QixHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsTUFBTSxFQUFFLEtBQUs7YUFDYjtZQUNELFVBQVUsRUFBRTtnQkFDWCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE1BQU0sRUFBRSxLQUFLO2FBQ2I7WUFDRCxZQUFZLEVBQUU7Z0JBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsTUFBTSxFQUFFLEtBQUs7YUFDYjtZQUNELGtCQUFrQixFQUFFO2dCQUNuQixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE1BQU0sRUFBRSxLQUFLO2FBQ2I7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsS0FBSzthQUNiO1NBQ0QsRUFDRDtZQUNDLFNBQVM7WUFDVCxTQUFTLEVBQUUsZ0JBQWdCO1lBQzNCLFVBQVUsRUFBRSxLQUFLO1NBQ2pCLENBQ0QsQ0FBQztRQUVGLE1BQU0sY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7Q0FBQTtBQUVELCtCQUErQjtBQUMvQixNQUFNLDBCQUEwQixHQUFHLDZCQUE2QixFQUFFLENBQUM7QUFDbkUsZUFBZSwwQkFBMEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdERhdGFUeXBlcyxcblx0TW9kZWwsXG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsXG5cdENyZWF0aW9uT3B0aW9uYWxcbn0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCBpbml0aWFsaXplRGF0YWJhc2UgZnJvbSAnLi4vY29uZmlnL2RiJztcbmltcG9ydCBVc2VyTW9kZWxQcm9taXNlIGZyb20gJy4vVXNlcic7XG5cbmludGVyZmFjZSBHdWVzdGJvb2tFbnRyeUF0dHJpYnV0ZXMge1xuXHRpZDogc3RyaW5nO1xuXHRndWVzdE5hbWU/OiBzdHJpbmcgfCBudWxsO1xuXHRndWVzdEVtYWlsPzogc3RyaW5nIHwgbnVsbDtcblx0Z3Vlc3RNZXNzYWdlOiBzdHJpbmc7XG5cdGd1ZXN0TWVzc2FnZVN0eWxlcz86IG9iamVjdCB8IG51bGw7XG5cdGVudHJ5RGF0ZTogRGF0ZTtcbn1cblxuY2xhc3MgR3Vlc3Rib29rRW50cnlcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8R3Vlc3Rib29rRW50cnk+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPEd1ZXN0Ym9va0VudHJ5PlxuXHQ+XG5cdGltcGxlbWVudHMgR3Vlc3Rib29rRW50cnlBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRndWVzdE5hbWUhOiBzdHJpbmcgfCBudWxsO1xuXHRndWVzdEVtYWlsITogc3RyaW5nIHwgbnVsbDtcblx0Z3Vlc3RNZXNzYWdlITogc3RyaW5nO1xuXHRndWVzdE1lc3NhZ2VTdHlsZXMhOiBvYmplY3QgfCBudWxsO1xuXHRlbnRyeURhdGUhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplR3Vlc3Rib29rRW50cnlNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBHdWVzdGJvb2tFbnRyeT4ge1xuXHRjb25zdCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblxuXHRHdWVzdGJvb2tFbnRyeS5pbml0KFxuXHRcdHtcblx0XHRcdGlkOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5VVUlELFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5VVUlEVjQsXG5cdFx0XHRcdHByaW1hcnlLZXk6IHRydWUsXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogdHJ1ZSxcblx0XHRcdFx0cmVmZXJlbmNlczoge1xuXHRcdFx0XHRcdG1vZGVsOiBhd2FpdCBVc2VyTW9kZWxQcm9taXNlLFxuXHRcdFx0XHRcdGtleTogJ2lkJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Z3Vlc3ROYW1lOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGd1ZXN0RW1haWw6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLlNUUklORyxcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Z3Vlc3RNZXNzYWdlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5URVhULFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0Z3Vlc3RNZXNzYWdlU3R5bGVzOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5KU09OLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRlbnRyeURhdGU6IHtcblx0XHRcdFx0dHlwZTogRGF0YVR5cGVzLkRBVEUsXG5cdFx0XHRcdGRlZmF1bHRWYWx1ZTogRGF0YVR5cGVzLk5PVyxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0c2VxdWVsaXplLFxuXHRcdFx0bW9kZWxOYW1lOiAnR3Vlc3Rib29rRW50cnknLFxuXHRcdFx0dGltZXN0YW1wczogZmFsc2Vcblx0XHR9XG5cdCk7XG5cblx0YXdhaXQgR3Vlc3Rib29rRW50cnkuc3luYygpO1xuXHRyZXR1cm4gR3Vlc3Rib29rRW50cnk7XG59XG5cbi8vIEV4cG9ydCB0aGUgaW5pdGlhbGl6ZWQgbW9kZWxcbmNvbnN0IEd1ZXN0Ym9va0VudHJ5TW9kZWxQcm9taXNlID0gaW5pdGlhbGl6ZUd1ZXN0Ym9va0VudHJ5TW9kZWwoKTtcbmV4cG9ydCBkZWZhdWx0IEd1ZXN0Ym9va0VudHJ5TW9kZWxQcm9taXNlO1xuIl19
