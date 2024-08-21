import { __awaiter } from 'tslib';
import { DataTypes, Model } from 'sequelize';
import initializeDatabase from '../config/db.js';
import UserModelPromise from './User.js';
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
		let sequelize = yield initializeDatabase();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3Vlc3Rib29rRW50cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9tb2RlbHMvR3Vlc3Rib29rRW50cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUlMLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sa0JBQWtCLE1BQU0sY0FBYyxDQUFDO0FBQzlDLE9BQU8sZ0JBQWdCLE1BQU0sUUFBUSxDQUFDO0FBV3RDLE1BQU0sY0FDTCxTQUFRLEtBR1A7SUFKRjs7UUFPQzs7Ozs7V0FBWTtRQUNaOzs7OztXQUEwQjtRQUMxQjs7Ozs7V0FBMkI7UUFDM0I7Ozs7O1dBQXNCO1FBQ3RCOzs7OztXQUFtQztRQUNuQzs7Ozs7V0FBbUM7SUFDcEMsQ0FBQztDQUFBO0FBRUQsU0FBZSw2QkFBNkI7O1FBQzNDLElBQUksU0FBUyxHQUFHLE1BQU0sa0JBQWtCLEVBQUUsQ0FBQztRQUUzQyxjQUFjLENBQUMsSUFBSSxDQUNsQjtZQUNDLEVBQUUsRUFBRTtnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFlBQVksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDOUIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsSUFBSTtnQkFDWixVQUFVLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO29CQUM3QixHQUFHLEVBQUUsSUFBSTtpQkFDVDthQUNEO1lBQ0QsU0FBUyxFQUFFO2dCQUNWLElBQUksRUFBRSxTQUFTLENBQUMsTUFBTTtnQkFDdEIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsTUFBTSxFQUFFLEtBQUs7YUFDYjtZQUNELFVBQVUsRUFBRTtnQkFDWCxJQUFJLEVBQUUsU0FBUyxDQUFDLE1BQU07Z0JBQ3RCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE1BQU0sRUFBRSxLQUFLO2FBQ2I7WUFDRCxZQUFZLEVBQUU7Z0JBQ2IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsS0FBSztnQkFDaEIsTUFBTSxFQUFFLEtBQUs7YUFDYjtZQUNELGtCQUFrQixFQUFFO2dCQUNuQixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE1BQU0sRUFBRSxLQUFLO2FBQ2I7WUFDRCxTQUFTLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixZQUFZLEVBQUUsU0FBUyxDQUFDLEdBQUc7Z0JBQzNCLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixNQUFNLEVBQUUsS0FBSzthQUNiO1NBQ0QsRUFDRDtZQUNDLFNBQVM7WUFDVCxTQUFTLEVBQUUsZ0JBQWdCO1lBQzNCLFVBQVUsRUFBRSxLQUFLO1NBQ2pCLENBQ0QsQ0FBQztRQUVGLE1BQU0sY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7Q0FBQTtBQUVELCtCQUErQjtBQUMvQixNQUFNLDBCQUEwQixHQUFHLDZCQUE2QixFQUFFLENBQUM7QUFDbkUsZUFBZSwwQkFBMEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG5cdERhdGFUeXBlcyxcblx0TW9kZWwsXG5cdEluZmVyQXR0cmlidXRlcyxcblx0SW5mZXJDcmVhdGlvbkF0dHJpYnV0ZXMsXG5cdENyZWF0aW9uT3B0aW9uYWxcbn0gZnJvbSAnc2VxdWVsaXplJztcbmltcG9ydCBpbml0aWFsaXplRGF0YWJhc2UgZnJvbSAnLi4vY29uZmlnL2RiJztcbmltcG9ydCBVc2VyTW9kZWxQcm9taXNlIGZyb20gJy4vVXNlcic7XG5cbmludGVyZmFjZSBHdWVzdGJvb2tFbnRyeUF0dHJpYnV0ZXMge1xuXHRpZDogc3RyaW5nO1xuXHRndWVzdE5hbWU/OiBzdHJpbmcgfCBudWxsO1xuXHRndWVzdEVtYWlsPzogc3RyaW5nIHwgbnVsbDtcblx0Z3Vlc3RNZXNzYWdlOiBzdHJpbmc7XG5cdGd1ZXN0TWVzc2FnZVN0eWxlcz86IG9iamVjdCB8IG51bGw7XG5cdGVudHJ5RGF0ZTogRGF0ZTtcbn1cblxuY2xhc3MgR3Vlc3Rib29rRW50cnlcblx0ZXh0ZW5kcyBNb2RlbDxcblx0XHRJbmZlckF0dHJpYnV0ZXM8R3Vlc3Rib29rRW50cnk+LFxuXHRcdEluZmVyQ3JlYXRpb25BdHRyaWJ1dGVzPEd1ZXN0Ym9va0VudHJ5PlxuXHQ+XG5cdGltcGxlbWVudHMgR3Vlc3Rib29rRW50cnlBdHRyaWJ1dGVzXG57XG5cdGlkITogc3RyaW5nO1xuXHRndWVzdE5hbWUhOiBzdHJpbmcgfCBudWxsO1xuXHRndWVzdEVtYWlsITogc3RyaW5nIHwgbnVsbDtcblx0Z3Vlc3RNZXNzYWdlITogc3RyaW5nO1xuXHRndWVzdE1lc3NhZ2VTdHlsZXMhOiBvYmplY3QgfCBudWxsO1xuXHRlbnRyeURhdGUhOiBDcmVhdGlvbk9wdGlvbmFsPERhdGU+O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplR3Vlc3Rib29rRW50cnlNb2RlbCgpOiBQcm9taXNlPHR5cGVvZiBHdWVzdGJvb2tFbnRyeT4ge1xuXHRsZXQgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cblx0R3Vlc3Rib29rRW50cnkuaW5pdChcblx0XHR7XG5cdFx0XHRpZDoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVVVJRCxcblx0XHRcdFx0ZGVmYXVsdFZhbHVlOiBEYXRhVHlwZXMuVVVJRFY0LFxuXHRcdFx0XHRwcmltYXJ5S2V5OiB0cnVlLFxuXHRcdFx0XHRhbGxvd051bGw6IGZhbHNlLFxuXHRcdFx0XHR1bmlxdWU6IHRydWUsXG5cdFx0XHRcdHJlZmVyZW5jZXM6IHtcblx0XHRcdFx0XHRtb2RlbDogYXdhaXQgVXNlck1vZGVsUHJvbWlzZSxcblx0XHRcdFx0XHRrZXk6ICdpZCdcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGd1ZXN0TmFtZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuU1RSSU5HLFxuXHRcdFx0XHRhbGxvd051bGw6IHRydWUsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRndWVzdEVtYWlsOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5TVFJJTkcsXG5cdFx0XHRcdGFsbG93TnVsbDogdHJ1ZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGd1ZXN0TWVzc2FnZToge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuVEVYVCxcblx0XHRcdFx0YWxsb3dOdWxsOiBmYWxzZSxcblx0XHRcdFx0dW5pcXVlOiBmYWxzZVxuXHRcdFx0fSxcblx0XHRcdGd1ZXN0TWVzc2FnZVN0eWxlczoge1xuXHRcdFx0XHR0eXBlOiBEYXRhVHlwZXMuSlNPTixcblx0XHRcdFx0YWxsb3dOdWxsOiB0cnVlLFxuXHRcdFx0XHR1bmlxdWU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0ZW50cnlEYXRlOiB7XG5cdFx0XHRcdHR5cGU6IERhdGFUeXBlcy5EQVRFLFxuXHRcdFx0XHRkZWZhdWx0VmFsdWU6IERhdGFUeXBlcy5OT1csXG5cdFx0XHRcdGFsbG93TnVsbDogZmFsc2UsXG5cdFx0XHRcdHVuaXF1ZTogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHtcblx0XHRcdHNlcXVlbGl6ZSxcblx0XHRcdG1vZGVsTmFtZTogJ0d1ZXN0Ym9va0VudHJ5Jyxcblx0XHRcdHRpbWVzdGFtcHM6IGZhbHNlXG5cdFx0fVxuXHQpO1xuXG5cdGF3YWl0IEd1ZXN0Ym9va0VudHJ5LnN5bmMoKTtcblx0cmV0dXJuIEd1ZXN0Ym9va0VudHJ5O1xufVxuXG4vLyBFeHBvcnQgdGhlIGluaXRpYWxpemVkIG1vZGVsXG5jb25zdCBHdWVzdGJvb2tFbnRyeU1vZGVsUHJvbWlzZSA9IGluaXRpYWxpemVHdWVzdGJvb2tFbnRyeU1vZGVsKCk7XG5leHBvcnQgZGVmYXVsdCBHdWVzdGJvb2tFbnRyeU1vZGVsUHJvbWlzZTtcbiJdfQ==
