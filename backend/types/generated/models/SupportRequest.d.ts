import { CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { Logger } from '../utils/logger';
interface SupportRequestAttributes {
    id: string;
    email: string;
    supportTicketNumber: number;
    supportType: string;
    supportContent: string;
    isSupportTicketOpen: boolean;
    supportTicketOpenDate: CreationOptional<Date>;
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
export default function createSupportRequestModel(sequelize: Sequelize, logger: Logger): typeof SupportRequest;
export { SupportRequest };
//# sourceMappingURL=SupportRequest.d.ts.map
