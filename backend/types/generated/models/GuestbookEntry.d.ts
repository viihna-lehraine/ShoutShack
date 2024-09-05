import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../config/logger';
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
export default function createGuestbookEntryModel(sequelize: Sequelize, logger: Logger): typeof GuestbookEntry;
export { GuestbookEntry };
//# sourceMappingURL=GuestbookEntry.d.ts.map