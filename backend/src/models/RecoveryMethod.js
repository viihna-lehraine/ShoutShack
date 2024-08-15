import {
    DataTypes,
    Model,
    Sequelize,
} from 'sequelize';
import initializeDatabase from '../config/db.js';

class RecoveryMethod extends Model {}

// Initialize the RecoveryMethod model
async function initializeRecoveryMethodModel() {
    const sequelize = await initializeDatabase();

    RecoveryMethod.init(
        {
            recoveryId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            methodType: {
                type: DataTypes.ENUM,
                values: ['email', 'phone', 'backupCodes'],
                allowNull: false,
            },
            contactDetail: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            backupCodes: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: true,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'RecoveryMethod',
            timestamps: true,
        }
    );

    await RecoveryMethod.sync();
}

export default initializeRecoveryMethodModel;
