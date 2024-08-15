import {
    DataTypes,
    Model,
    Sequelize,
} from 'sequelize';
import initializeDatabase from '../config/db.js';

class MultiFactorAuthSetup extends Model {}

// Initialize the MultiFactorAuthSetup model
async function initializeMultiFactorAuthSetupModel() {
    const sequelize = await initializeDatabase();

    MultiFactorAuthSetup.init(
        {
            mfaId: {
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
            method: {
                type: DataTypes.ENUM,
                values: ['totp', 'email', 'yubico', 'fido2', 'passkey'],
                allowNull: false,
            },
            secret: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            publicKey: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            counter: {
                type: DataTypes.INTEGER,
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
            modelName: 'MultiFactorAuthSetup',
            timestamps: true,
        }
    );

    await MultiFactorAuthSetup.sync();
}

export default initializeMultiFactorAuthSetupModel;
