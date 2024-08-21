import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
interface GuestbookEntryAttributes {
    id: string;
    guestName?: string | null;
    guestEmail?: string | null;
    guestMessage: string;
    guestMessageStyles?: object | null;
    entryDate: Date;
}
declare class GuestbookEntry extends Model<InferAttributes<GuestbookEntry>, InferCreationAttributes<GuestbookEntry>> implements GuestbookEntryAttributes {
    id: string;
    guestName: string | null;
    guestEmail: string | null;
    guestMessage: string;
    guestMessageStyles: object | null;
    entryDate: CreationOptional<Date>;
}
export default GuestbookEntry;
//# sourceMappingURL=GuestbookEntry.d.ts.map