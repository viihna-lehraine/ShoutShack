import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { SupportRequestAttributes } from '../index/interfaces/models';
declare class SupportRequest extends Model<InferAttributes<SupportRequest>, InferCreationAttributes<SupportRequest>> implements SupportRequestAttributes {
    id: string;
    email: string;
    supportTicketNumber: number;
    supportType: string;
    supportContent: string;
    isSupportTicketOpen: boolean;
    supportTicketOpenDate: Date;
    supportTicketCloseDate?: Date | null;
}
export declare function createSupportRequestModel(): Promise<typeof SupportRequest | null>;
export { SupportRequest };
//# sourceMappingURL=SupportRequest.d.ts.map