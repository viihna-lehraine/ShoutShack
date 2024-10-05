import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { BlotEntryAttributes } from '../index/interfaces/models';
export declare class BlotEntry extends Model<InferAttributes<BlotEntry>, InferCreationAttributes<BlotEntry>> implements BlotEntryAttributes {
    id: string;
    guestName: string | null;
    guestEmail: string | null;
    guestMessage: string;
    guestMessageStyles: object | null;
    entryDate: CreationOptional<Date>;
}
export declare function createBlotEntryModel(): Promise<typeof BlotEntry | null>;
//# sourceMappingURL=BlotEntryAttributes.d.ts.map