import {
	DataTypes,
	Model,
	InferAttributes,
	InferCreationAttributes
} from 'sequelize';
import { getSequelizeInstance } from '../config/db';
import User from './User';

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

// Get the Sequelize instance
const sequelize = getSequelizeInstance();

// Initialize the SupportRequest model
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
			defaultValue: null
		}
	},
	{
		sequelize,
		modelName: 'SupportRequest',
		timestamps: true
	}
);

export default SupportRequest;
