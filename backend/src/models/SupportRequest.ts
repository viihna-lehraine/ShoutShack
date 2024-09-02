import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';
import { User } from './User';

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

class SupportRequest
	extends Model<
		InferAttributes<SupportRequest>,
		InferCreationAttributes<SupportRequest>
	>
	implements SupportRequestAttributes
{
	id!: string;
	email!: string;
	supportTicketNumber!: number;
	supportType!: string;
	supportContent!: string;
	isSupportTicketOpen!: boolean;
	supportTicketOpenDate!: Date;
	supportTicketCloseDate?: Date | null;
}

export default function createSupportRequestModel(
	sequelize: Sequelize
): typeof SupportRequest {
	SupportRequest.init(
		{
			id: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				primaryKey: true,
				allowNull: false,
				unique: true,
				references: {
					model: User,
					key: 'id'
				}
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false
			},
			supportTicketNumber: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				allowNull: true,
				unique: true
			},
			supportType: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			supportContent: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			isSupportTicketOpen: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false
			},
			supportTicketOpenDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			supportTicketCloseDate: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: undefined
			}
		},
		{
			sequelize,
			modelName: 'SupportRequest',
			timestamps: true
		}
	);

	return SupportRequest;
}
