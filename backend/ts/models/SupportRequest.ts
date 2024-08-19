import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import initializeDatabase from '../config/db.js';

interface SupportRequestAttributes {
	userId: string;
	email: string;
	ticketNumber: number;
	issueType: string;
	issueContent: string;
	createdAt: Date;
	isTicketOpen: boolean;
	closedAt?: Date | null;
}

class SupportRequest extends Model<InferAttributes<SupportRequest>, InferCreationAttributes<SupportRequest>> implements SupportRequestAttributes {
	userId!: string;
	email!: string;
	ticketNumber!: number;
	issueType!: string;
	issueContent!: string;
	createdAt!: CreationOptional<Date>;
	isTicketOpen!: boolean;
	closedAt!: Date | null;
}

async function initializeSupportRequestModel(): Promise<typeof SupportRequest> {
	const sequelize = await initializeDatabase();

	SupportRequest.init(
		{
			userId: {
				type: DataTypes.UUID,
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			ticketNumber: {
				type: DataTypes.INTEGER,
				allowNull: false,
				unique: true,
			},
			issueType: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			issueContent: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			isTicketOpen: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			closedAt: {
				type: DataTypes.DATE,
				allowNull: true,
				defaultValue: null,
			},
		},
		{
			sequelize,
			modelName: 'SupportRequest',
			timestamps: true,
		}
	);

	await SupportRequest.sync();
	return SupportRequest;
}

const SupportRequestModelPromise = initializeSupportRequestModel();
export default SupportRequestModelPromise;
