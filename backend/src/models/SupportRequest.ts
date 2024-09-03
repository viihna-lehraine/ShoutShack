import {
	InferAttributes,
	InferCreationAttributes,
	Model,
	DataTypes,
	Sequelize,
	CreationOptional
} from 'sequelize';
import { User } from './User';

interface SupportRequestAttributes {
	id: string; // UUID for support request, primary key
	email: string; // email address of the user submitting the support request
	supportTicketNumber: number; // unique support ticket number, auto-incremented
	supportType: string; // type of support request
	supportContent: string; // content/details of the support request
	isSupportTicketOpen: boolean; // boolean indicating if the support ticket is open or closed
	supportTicketOpenDate: CreationOptional<Date>; // date the support ticket was opened
	supportTicketCloseDate?: Date | null; // date the support ticket was closed, nullable (should be set to true when the ticket is closed)
}

class SupportRequest
	extends Model<
		InferAttributes<SupportRequest>,
		InferCreationAttributes<SupportRequest>
	>
	implements SupportRequestAttributes
{
	id!: string; // initialized as a non-nullable string (UUID)
	email!: string; // initialized as a non-nullable string
	supportTicketNumber!: number; // initialized as a non-nullable integer
	supportType!: string; // initialized as a non-nullable string
	supportContent!: string; // initialized as a non-nullable string
	isSupportTicketOpen!: boolean; // initialized as a non-nullable boolean
	supportTicketOpenDate!: Date; // initialized as a non-nullable date
	supportTicketCloseDate?: Date | null; // nullable, may contain date or null
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
				allowNull: false // email address is required in order to follow up with support requests
			},
			supportTicketNumber: {
				type: DataTypes.INTEGER,
				autoIncrement: true, // auto-increment for unique support tickets
				allowNull: true,
				unique: true
			},
			supportType: {
				type: DataTypes.TEXT,
				allowNull: false // support type is required to categorize the support request
			},
			supportContent: {
				type: DataTypes.TEXT,
				allowNull: false // support content/details are required to address the support request
			},
			isSupportTicketOpen: {
				type: DataTypes.BOOLEAN,
				defaultValue: true, // support ticket is open by default
				allowNull: false // support ticket status is required
			},
			supportTicketOpenDate: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW, // default to current date/time
				allowNull: false // open date is required
			},
			supportTicketCloseDate: {
				type: DataTypes.DATE,
				allowNull: true // close date is optional, set to true when the ticket is closed
			}
		},
		{
			sequelize,
			modelName: 'SupportRequest',
			timestamps: true // automatically manage createdAt and updatedAt fields
		}
	);

	// define associations
	SupportRequest.belongsTo(User, { foreignKey: 'id', as: 'user' });

	return SupportRequest;
}
