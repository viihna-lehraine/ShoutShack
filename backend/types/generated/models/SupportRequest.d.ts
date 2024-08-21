import { InferAttributes, InferCreationAttributes, Model } from 'sequelize';
interface SupportRequestAttributes {
    id: string;
    email: string;
    supportTicketNumber: number;
    supportType: string;
    supportContent: string;
    isSupportTicketOpen: boolean;
    supportTicketOpenDate: Date;
    supportTicketCloseDate?: Date | null;
}
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
export default SupportRequest;
//# sourceMappingURL=SupportRequest.d.ts.map