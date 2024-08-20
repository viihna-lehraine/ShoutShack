import { DataTypes, Model, Sequelize } from 'sequelize';
import initializeDatabase from '../config/db.js';

class SupportRequest extends Model {}

async function initializeSupportRequestModel() {
	const sequelize = await initializeDatabase();

	SupportRequest.init(
		{
			userId: {
				type: DataTypes.UUID,
				allowNull: false
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false
			},
			ticketNumber: {
				type: DataTypes.INTEGER,
				allowNull: false,
				unique: true
			},
			issueType: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			issueContent: {
				type: DataTypes.TEXT,
				allowNull: false
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: Sequelize.NOW,
				allowNull: false
			},
			isTicketOpen: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false
			},
			closedAt: {
				type: DataTypes.DATE,
				defaultValue: null
			}
		},
		{
			sequelize,
			modelName: 'SupportRequest',
			timestamps: true
		}
	);
}

const SupportRequestModelPromise = (async () => {
	await initializeSupportRequestModel();
	return SupportRequest;
})();

export default SupportRequestModelPromise;
