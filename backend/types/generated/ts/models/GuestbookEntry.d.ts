import {
	Model,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional
} from 'sequelize';
interface GuestbookEntryAttributes {
	id: string;
	guestName?: string | null;
	guestEmail?: string | null;
	guestMessage: string;
	guestMessageStyles?: object | null;
	entryDate: Date;
}
declare class GuestbookEntry
	extends Model<
		InferAttributes<GuestbookEntry>,
		InferCreationAttributes<GuestbookEntry>
	>
	implements GuestbookEntryAttributes
{
	id: string;
	guestName: string | null;
	guestEmail: string | null;
	guestMessage: string;
	guestMessageStyles: object | null;
	entryDate: CreationOptional<Date>;
}
declare const GuestbookEntryModelPromise: Promise<typeof GuestbookEntry>;
export default GuestbookEntryModelPromise;
//# sourceMappingURL=GuestbookEntry.d.ts.map
