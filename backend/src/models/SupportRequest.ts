import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize
} from 'sequelize';

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
				type: DataTypes.STRING,
				allowNull: false,
				primaryKey: true
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false
			},
			supportTicketNumber: {
				type: DataTypes.INTEGER,
				allowNull: false,
				autoIncrement: true,
				primaryKey: false // assuming the id is the primary key
			},
			supportType: {
				type: DataTypes.STRING,
				allowNull: false
			},
			supportContent: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			isSupportTicketOpen: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			supportTicketOpenDate: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: DataTypes.NOW
			},
			supportTicketCloseDate: {
				type: DataTypes.DATE,
				allowNull: true
			}
		},
		{
			sequelize,
			tableName: 'SupportRequests',
			timestamps: false
		}
	);

	return SupportRequest;
}
